export const MAX_BATCH_ARTIFACTS = 10;
export const INGEST_PARSER_VERSION = "0.1.0";

export type IngestOrigin = "paste" | "upload" | "manual";
export type IngestMode =
  | "conversation_paste"
  | "provider_export_json"
  | "standalone_artifact"
  | "standalone_prompt"
  | "audio_link";
export type ArtifactType = "text" | "image" | "audio_link";
export type IngestProvider =
  | "chatgpt"
  | "claude"
  | "gemini"
  | "grok"
  | "generic";
export type ConfidenceLevel = "high" | "medium" | "low";
export type PreviewPresentation =
  | "prompt_and_output"
  | "prompt_only"
  | "artifact_only"
  | "media_only"
  | "link_only";

export interface IngestFileDescriptor {
  name: string;
  type: string;
  size: number;
  textContent?: string;
}

export interface IngestPreviewRequest {
  textInput: string;
  files: IngestFileDescriptor[];
}

export interface IngestSignal {
  label: string;
  evidence: string;
}

export interface IngestClassification {
  mode: IngestMode;
  provider?: IngestProvider;
  confidence: ConfidenceLevel;
  artifactType: ArtifactType;
  reasons: string[];
  signals: IngestSignal[];
}

export interface IngestPreviewItem {
  id: string;
  title: string;
  artifactType: ArtifactType;
  presentation: PreviewPresentation;
  summary: string;
  promptPreview?: string;
  contentPreview?: string;
  metadata: {
    sourceModel?: string;
    sourceSurface?: string;
    detectedPrompt?: string;
    fileName?: string;
    rawLength?: number;
    parserVersion: string;
    visibility: "private";
  };
  warnings: string[];
  classification: IngestClassification;
}

export interface IngestPreviewResponse {
  receivedAt: string;
  itemCount: number;
  items: IngestPreviewItem[];
  warnings: string[];
}

export interface IngestSaveRequest {
  preview: IngestPreviewResponse;
}

export interface IngestSaveReceipt {
  savedId: string;
  title: string;
  artifactType: ArtifactType;
  visibility: "private";
}

export interface IngestSaveResponse {
  savedAt: string;
  savedCount: number;
  receipts: IngestSaveReceipt[];
}

export interface ProviderExportGuide {
  provider: IngestProvider;
  label: string;
  statusLabel: string;
  uploadTarget: string;
  steps: string[];
  notes: string[];
  sourceUrl?: string;
}

