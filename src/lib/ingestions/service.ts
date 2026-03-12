import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@/lib/supabase/server";
import { extractItems, PARSE_VERSION } from "@/lib/ingestions/extract";
import {
  createArtifactsAndLinks,
  createId,
  getIngestionBundle,
  getLocalStoreDir,
  listArtifacts,
  listIngestions,
  replaceIngestionItems,
  upsertIngestion,
  updateIngestionItemRecord,
} from "@/lib/ingestions/store";
import type {
  AnalyzeIngestionInput,
  ArtifactLinkRecord,
  ArtifactRecord,
  CreateDraftInput,
  IngestionItemRecord,
  IngestionRecord,
  UpdateIngestionItemInput,
  UploadedFileReference,
} from "@/lib/ingestions/types";

async function getUserId(): Promise<string> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Unauthorized");
  return user.id;
}

function now(): string {
  return new Date().toISOString();
}

function getUploadsDir(): string {
  return path.join(getLocalStoreDir(), "uploads");
}

export async function createIngestionDraft(
  input: CreateDraftInput,
): Promise<IngestionRecord> {
  const userId = await getUserId();
  const timestamp = now();
  const record: IngestionRecord = {
    id: createId(),
    userId,
    kind: input.kind,
    status: "draft",
    sourceProvider:
      input.sourceProviderHint && input.sourceProviderHint !== "auto"
        ? input.sourceProviderHint
        : "unknown",
    sourceSurface: input.sourceSurfaceHint?.trim() || input.kind,
    rawText: null,
    rawFilePath: null,
    rawFileMime: null,
    rawFileName: null,
    parseVersion: PARSE_VERSION,
    warnings: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  await upsertIngestion(record);
  return record;
}

async function writePreservedFile(
  ingestionId: string,
  file: File,
): Promise<UploadedFileReference> {
  const uploadsDir = getUploadsDir();
  const dir = path.join(uploadsDir, ingestionId);
  await mkdir(dir, { recursive: true });
  const safeName = `${randomUUID()}-${file.name.replace(/[^\w.-]/g, "_")}`;
  const preservedPath = path.join(dir, safeName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(preservedPath, buffer);

  const textContent = file.type.startsWith("text/") || /\.(json|jsonl|md|txt)$/i.test(file.name)
    ? await readFile(preservedPath, "utf8").catch(() => undefined)
    : undefined;

  return {
    originalName: file.name,
    mimeType: file.type || "application/octet-stream",
    preservedPath,
    sizeBytes: buffer.byteLength,
    textContent,
  };
}

async function writeUploadManifest(
  ingestionId: string,
  files: UploadedFileReference[],
): Promise<void> {
  const dir = path.join(getUploadsDir(), ingestionId);
  await mkdir(dir, { recursive: true });
  await writeFile(
    path.join(dir, "manifest.json"),
    JSON.stringify(files, null, 2),
    "utf8",
  );
}

async function readUploadManifest(
  ingestionId: string,
): Promise<UploadedFileReference[]> {
  const manifestPath = path.join(getUploadsDir(), ingestionId, "manifest.json");
  const raw = await readFile(manifestPath, "utf8").catch(() => "");
  return raw ? (JSON.parse(raw) as UploadedFileReference[]) : [];
}

export async function uploadIngestionSource(
  ingestionId: string,
  files: File[],
): Promise<UploadedFileReference[]> {
  const bundle = await getIngestionBundle(ingestionId);
  if (!bundle.ingestion) {
    throw new Error("Ingestion not found.");
  }

  const uploaded = await Promise.all(files.map((file) => writePreservedFile(ingestionId, file)));
  await writeUploadManifest(ingestionId, uploaded);
  const firstFile = uploaded[0];
  const record: IngestionRecord = {
    ...bundle.ingestion,
    rawFilePath: firstFile?.preservedPath ?? bundle.ingestion.rawFilePath,
    rawFileMime: firstFile?.mimeType ?? bundle.ingestion.rawFileMime,
    rawFileName: firstFile?.originalName ?? bundle.ingestion.rawFileName,
    updatedAt: now(),
  };
  await upsertIngestion(record);
  return uploaded;
}

export async function analyzeIngestion(
  ingestionId: string,
  input: AnalyzeIngestionInput,
  uploadedFiles: UploadedFileReference[] = [],
): Promise<{
  ingestion: IngestionRecord;
  items: IngestionItemRecord[];
}> {
  const bundle = await getIngestionBundle(ingestionId);
  if (!bundle.ingestion) {
    throw new Error("Ingestion not found.");
  }

  const rawText =
    input.rawText ??
    (uploadedFiles.length === 1 ? uploadedFiles[0].textContent ?? "" : bundle.ingestion.rawText ?? "");
  const filesForAnalysis =
    uploadedFiles.length > 0 ? uploadedFiles : await readUploadManifest(ingestionId);

  const extraction = await extractItems({
    kind: bundle.ingestion.kind,
    rawText,
    files: filesForAnalysis,
    audioLinks: input.audioLinks ?? [],
    sourceProviderHint: input.sourceProviderHint,
    sourceSurfaceHint: input.sourceSurfaceHint,
  });

  const timestamp = now();
  const record: IngestionRecord = {
    ...bundle.ingestion,
    status: "analyzed",
    sourceProvider: extraction.sourceProvider,
    sourceSurface: extraction.sourceSurface,
    rawText:
      bundle.ingestion.kind === "conversation_paste" || bundle.ingestion.kind === "prompt_only"
        ? rawText
        : bundle.ingestion.rawText,
    warnings: extraction.warnings,
    updatedAt: timestamp,
  };

  const items: IngestionItemRecord[] = extraction.items.map((item) => ({
    id: createId(),
    ingestionId,
    position: item.position,
    itemKind: "artifact",
    artifactType: item.artifactType,
    contentRole: item.contentRole,
    rawText: item.rawText,
    parsedMarkdown: item.parsedMarkdown,
    title: item.title,
    metadata: {
      ingestion_id: ingestionId,
      source_provider: extraction.sourceProvider,
      source_surface: extraction.sourceSurface,
      parse_version: PARSE_VERSION,
      ...item.metadata,
    },
    tags: item.tags,
    include: item.defaultInclude,
    createdAt: timestamp,
  }));

  await upsertIngestion(record);
  await replaceIngestionItems(ingestionId, items);

  return { ingestion: record, items };
}

export async function updateIngestionItem(
  ingestionId: string,
  itemId: string,
  input: UpdateIngestionItemInput,
): Promise<IngestionItemRecord> {
  const updated = await updateIngestionItemRecord(ingestionId, itemId, (item) => ({
    ...item,
    include: input.include ?? item.include,
    title: input.title === undefined ? item.title : input.title,
    tags: input.tags ?? item.tags,
  }));

  if (!updated) {
    throw new Error("Ingestion item not found.");
  }

  return updated;
}

export async function commitIngestion(ingestionId: string): Promise<{
  ingestion: IngestionRecord;
  artifacts: ArtifactRecord[];
  links: ArtifactLinkRecord[];
}> {
  const bundle = await getIngestionBundle(ingestionId);
  if (!bundle.ingestion) {
    throw new Error("Ingestion not found.");
  }
  const ingestion = bundle.ingestion;
  if (ingestion.status !== "analyzed") {
    throw new Error("Analyze the ingestion before committing it.");
  }

  const included = bundle.items.filter((item) => item.include);
  if (included.length === 0) {
    throw new Error("No ingestion items are selected for commit.");
  }

  const timestamp = now();
  const artifacts: ArtifactRecord[] = included.map((item) => {
    const metadata = {
      ...item.metadata,
      content_role: item.contentRole,
      captured_at: timestamp,
      raw_source_ref: ingestion.rawFilePath ?? ingestion.rawText ?? null,
    };

    return {
      id: createId(),
      userId: ingestion.userId,
      title: item.title,
      type: item.artifactType,
      rawContent: item.artifactType === "text" ? item.rawText : null,
      parsedMarkdown: item.artifactType === "text" ? item.parsedMarkdown : null,
      storagePath:
        item.artifactType === "image"
          ? String(item.metadata.preserved_file_path ?? ingestion.rawFilePath ?? "")
          : null,
      audioUrl:
        item.artifactType === "audio_link"
          ? String(item.metadata.original_url ?? "")
          : null,
      description: null,
      metadata,
      tags: item.tags,
      visibility: "private",
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  });

  const links: ArtifactLinkRecord[] = [];
  for (let index = 0; index < artifacts.length - 1; index += 1) {
    const from = artifacts[index];
    const to = artifacts[index + 1];
    const relationshipType =
      from.metadata.content_role === "prompt" && to.metadata.content_role === "response"
        ? "prompt_to_response"
        : "same_ingestion";

    links.push({
      id: createId(),
      userId: ingestion.userId,
      fromArtifactId: from.id,
      toArtifactId: to.id,
      relationshipType,
      confidence: 1,
      origin: "parser",
      ingestionId,
      createdAt: timestamp,
    });
  }

  await createArtifactsAndLinks(artifacts, links);

  const updatedIngestion: IngestionRecord = {
    ...ingestion,
    status: "committed",
    updatedAt: timestamp,
  };
  await upsertIngestion(updatedIngestion);

  return {
    ingestion: updatedIngestion,
    artifacts,
    links,
  };
}

export async function discardIngestion(ingestionId: string): Promise<IngestionRecord> {
  const bundle = await getIngestionBundle(ingestionId);
  if (!bundle.ingestion) {
    throw new Error("Ingestion not found.");
  }
  const updated: IngestionRecord = {
    ...bundle.ingestion,
    status: "discarded",
    updatedAt: now(),
  };
  await upsertIngestion(updated);
  return updated;
}

export async function getIngestion(ingestionId: string): Promise<{
  ingestion: IngestionRecord | null;
  items: IngestionItemRecord[];
}> {
  return getIngestionBundle(ingestionId);
}

export async function getDashboardSnapshot(): Promise<{
  ingestions: IngestionRecord[];
  artifacts: ArtifactRecord[];
}> {
  const [ingestions, artifacts] = await Promise.all([listIngestions(), listArtifacts()]);
  return { ingestions, artifacts };
}

export async function ensureStoreReady(): Promise<void> {
  await mkdir(getLocalStoreDir(), { recursive: true });
}
