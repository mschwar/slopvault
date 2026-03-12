import type {
  ArtifactLinkRecord,
  ArtifactRecord,
  IngestionItemRecord,
  IngestionKind,
  IngestionRecord,
  SourceProvider,
  UpdateIngestionItemInput,
  UploadedFileReference,
} from "@/lib/ingestions/types";

type Snapshot = {
  ingestions: IngestionRecord[];
  artifacts: ArtifactRecord[];
};

type Bundle = {
  ingestion: IngestionRecord;
  items: IngestionItemRecord[];
};

async function apiCall<T>(input: Promise<Response>): Promise<T> {
  const response = await input;
  const payload = (await response.json()) as T & { error?: string };

  if (!response.ok && "error" in payload && payload.error) {
    throw new Error(payload.error);
  }
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return payload;
}

export async function getIngestionsSnapshot(): Promise<Snapshot> {
  return apiCall<Snapshot>(fetch("/api/ingestions"));
}

export async function getIngestionBundle(ingestionId: string): Promise<Bundle> {
  return apiCall<Bundle>(fetch(`/api/ingestions/${ingestionId}`));
}

export async function createIngestionDraft(
  kind: IngestionKind,
  sourceProviderHint?: SourceProvider | "auto",
): Promise<{ ingestion: IngestionRecord }> {
  return apiCall<{ ingestion: IngestionRecord }>(
    fetch("/api/ingestions/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind,
        sourceProviderHint,
      }),
    }),
  );
}

export async function uploadIngestionSource(
  ingestionId: string,
  files: File[],
): Promise<{ uploaded: UploadedFileReference[] }> {
  const formData = new FormData();
  for (const file of files.slice(0, 10)) {
    formData.append("files", file);
  }

  return apiCall<{ uploaded: UploadedFileReference[] }>(
    fetch(`/api/ingestions/${ingestionId}/upload`, {
      method: "POST",
      body: formData,
    }),
  );
}

export async function analyzeIngestion(
  ingestionId: string,
  input: {
    rawText?: string;
    audioLinks?: string[];
    sourceProviderHint?: SourceProvider | "auto";
    sourceSurfaceHint?: string;
  },
): Promise<Bundle> {
  return apiCall<Bundle>(
    fetch(`/api/ingestions/${ingestionId}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
}

export async function updateIngestionItem(
  ingestionId: string,
  itemId: string,
  input: UpdateIngestionItemInput,
): Promise<{ item: IngestionItemRecord }> {
  return apiCall<{ item: IngestionItemRecord }>(
    fetch(`/api/ingestions/${ingestionId}/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
}

export async function commitIngestion(
  ingestionId: string,
): Promise<{
  ingestion: IngestionRecord;
  artifacts: ArtifactRecord[];
  links: ArtifactLinkRecord[];
}> {
  return apiCall<{
    ingestion: IngestionRecord;
    artifacts: ArtifactRecord[];
    links: ArtifactLinkRecord[];
  }>(fetch(`/api/ingestions/${ingestionId}/commit`, { method: "POST" }));
}

export async function discardIngestion(
  ingestionId: string,
): Promise<{ ingestion: IngestionRecord }> {
  return apiCall<{ ingestion: IngestionRecord }>(
    fetch(`/api/ingestions/${ingestionId}/discard`, { method: "POST" }),
  );
}

