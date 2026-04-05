export const INGESTION_KINDS = [
  "source_json_upload",
  "conversation_paste",
  "artifact_batch",
  "prompt_only",
] as const;

export const INGESTION_STATUSES = [
  "draft",
  "analyzed",
  "committed",
  "discarded",
  "failed",
] as const;

export const SOURCE_PROVIDERS = [
  "openai",
  "google",
  "anthropic",
  "xai",
  "unknown",
] as const;

export const ARTIFACT_TYPES = ["text", "image", "audio_link"] as const;

export const CONTENT_ROLES = [
  "prompt",
  "response",
  "artifact",
  "upload",
  "unknown",
] as const;

export const LINK_RELATIONSHIP_TYPES = [
  "prompt_to_response",
  "same_ingestion",
  "attachment_of",
  "derived_from",
] as const;

export type IngestionKind = (typeof INGESTION_KINDS)[number];
export type IngestionStatus = (typeof INGESTION_STATUSES)[number];
export type SourceProvider = (typeof SOURCE_PROVIDERS)[number];
export type ArtifactType = (typeof ARTIFACT_TYPES)[number];
export type ContentRole = (typeof CONTENT_ROLES)[number];
export type LinkRelationshipType = (typeof LINK_RELATIONSHIP_TYPES)[number];

export interface MetadataRecord {
  [key: string]: unknown;
}

export interface IngestionRecord {
  id: string;
  userId: string;
  kind: IngestionKind;
  status: IngestionStatus;
  sourceProvider: SourceProvider;
  sourceSurface: string;
  rawText: string | null;
  rawFilePath: string | null;
  rawFileMime: string | null;
  rawFileName: string | null;
  parseVersion: string;
  warnings: string[];
  createdAt: string;
  updatedAt: string;
}

export interface IngestionItemRecord {
  id: string;
  ingestionId: string;
  position: number;
  itemKind: "artifact";
  artifactType: ArtifactType;
  contentRole: ContentRole;
  rawText: string | null;
  parsedMarkdown: string | null;
  title: string | null;
  metadata: MetadataRecord;
  tags: string[];
  include: boolean;
  createdAt: string;
}

export interface ArtifactRecord {
  id: string;
  userId: string;
  title: string | null;
  type: ArtifactType;
  rawContent: string | null;
  parsedMarkdown: string | null;
  storagePath: string | null;
  audioUrl: string | null;
  description: string | null;
  metadata: MetadataRecord;
  tags: string[];
  visibility: "private" | "public";
  createdAt: string;
  updatedAt: string;
}

export interface ArtifactLinkRecord {
  id: string;
  userId: string;
  fromArtifactId: string;
  toArtifactId: string;
  relationshipType: LinkRelationshipType;
  confidence: number;
  origin: "system" | "parser" | "user";
  ingestionId: string;
  createdAt: string;
}

export interface NodeRecord {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  hook: string | null;
  parentNodeId: string | null;
  visibility: "private" | "public";
  upvotes: number;
  forkCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface NodeArtifactRecord {
  id: string;
  nodeId: string;
  artifactId: string;
  position: number;
}

export interface NodeBundle {
  node: NodeRecord;
  artifacts: ArtifactRecord[];
}

export interface CreateNodeInput {
  title: string;
  description?: string;
  hook?: string;
  artifactIds: string[];
}

export interface UpdateNodeInput {
  title?: string;
  description?: string | null;
  hook?: string | null;
  visibility?: "private" | "public";
  artifactIds?: string[]; // For reordering or batch update
}

export interface UploadedFileReference {
  originalName: string;
  mimeType: string;
  storagePath: string;
  sizeBytes: number;
  textContent?: string;
}

export interface ExtractedItem {
  position: number;
  artifactType: ArtifactType;
  contentRole: ContentRole;
  rawText: string | null;
  parsedMarkdown: string | null;
  title: string | null;
  metadata: MetadataRecord;
  tags: string[];
  defaultInclude: boolean;
}

export interface ExtractionResult {
  sourceProvider: SourceProvider;
  sourceSurface: string;
  warnings: string[];
  items: ExtractedItem[];
}

export interface CreateDraftInput {
  kind: IngestionKind;
  sourceProviderHint?: SourceProvider | "auto";
  sourceSurfaceHint?: string;
}

export interface AnalyzeIngestionInput {
  rawText?: string;
  audioLinks?: string[];
  sourceProviderHint?: SourceProvider | "auto";
  sourceSurfaceHint?: string;
}

export interface UpdateIngestionItemInput {
  include?: boolean;
  title?: string | null;
  tags?: string[];
}
