import { randomUUID } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type {
  ArtifactLinkRecord,
  ArtifactRecord,
  IngestionItemRecord,
  IngestionRecord,
  LocalDataStore,
} from "@/lib/ingestions/types";

const DEFAULT_STORE_DIR = path.join(os.tmpdir(), "slopvault-local-store");
const STORE_FILE = "store.json";

function getStoreDir(): string {
  return process.env.SLOPVAULT_STORE_DIR ?? DEFAULT_STORE_DIR;
}

async function ensureStore(): Promise<string> {
  const storeDir = getStoreDir();
  await mkdir(storeDir, { recursive: true });
  const filePath = path.join(storeDir, STORE_FILE);

  try {
    await stat(filePath);
  } catch {
    const empty: LocalDataStore = {
      ingestions: [],
      ingestionItems: [],
      artifacts: [],
      artifactLinks: [],
    };
    await writeFile(filePath, JSON.stringify(empty, null, 2), "utf8");
  }

  return filePath;
}

export async function readStore(): Promise<LocalDataStore> {
  const filePath = await ensureStore();
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as LocalDataStore;
}

export async function writeStore(data: LocalDataStore): Promise<void> {
  const filePath = await ensureStore();
  await writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}

export async function upsertIngestion(record: IngestionRecord): Promise<void> {
  const data = await readStore();
  const index = data.ingestions.findIndex((item) => item.id === record.id);
  if (index >= 0) {
    data.ingestions[index] = record;
  } else {
    data.ingestions.push(record);
  }
  await writeStore(data);
}

export async function replaceIngestionItems(
  ingestionId: string,
  items: IngestionItemRecord[],
): Promise<void> {
  const data = await readStore();
  data.ingestionItems = data.ingestionItems.filter(
    (item) => item.ingestionId !== ingestionId,
  );
  data.ingestionItems.push(...items);
  await writeStore(data);
}

export async function updateIngestionItemRecord(
  ingestionId: string,
  itemId: string,
  updater: (item: IngestionItemRecord) => IngestionItemRecord,
): Promise<IngestionItemRecord | null> {
  const data = await readStore();
  const index = data.ingestionItems.findIndex(
    (item) => item.ingestionId === ingestionId && item.id === itemId,
  );
  if (index < 0) {
    return null;
  }
  data.ingestionItems[index] = updater(data.ingestionItems[index]);
  await writeStore(data);
  return data.ingestionItems[index];
}

export async function createArtifactsAndLinks(
  artifacts: ArtifactRecord[],
  links: ArtifactLinkRecord[],
): Promise<void> {
  const data = await readStore();
  data.artifacts.push(...artifacts);
  data.artifactLinks.push(...links);
  await writeStore(data);
}

export async function getIngestionBundle(ingestionId: string): Promise<{
  ingestion: IngestionRecord | null;
  items: IngestionItemRecord[];
}> {
  const data = await readStore();
  return {
    ingestion: data.ingestions.find((item) => item.id === ingestionId) ?? null,
    items: data.ingestionItems
      .filter((item) => item.ingestionId === ingestionId)
      .sort((a, b) => a.position - b.position),
  };
}

export async function listIngestions(): Promise<IngestionRecord[]> {
  const data = await readStore();
  return [...data.ingestions].sort((a, b) =>
    a.updatedAt < b.updatedAt ? 1 : -1,
  );
}

export async function listArtifacts(): Promise<ArtifactRecord[]> {
  const data = await readStore();
  return [...data.artifacts].sort((a, b) =>
    a.updatedAt < b.updatedAt ? 1 : -1,
  );
}

export function createId(): string {
  return randomUUID();
}

export function getLocalStoreDir(): string {
  return getStoreDir();
}
