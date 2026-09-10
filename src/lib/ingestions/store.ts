import { createClient } from "@/lib/supabase/server";
import type {
  ArtifactLinkRecord,
  ArtifactRecord,
  IngestionItemRecord,
  IngestionRecord,
} from "@/lib/ingestions/types";

// Helper to map Supabase snake_case to camelCase
function mapIngestion(row: any): IngestionRecord {
  return {
    id: row.id,
    userId: row.user_id,
    kind: row.kind,
    status: row.status,
    sourceProvider: row.source_provider,
    sourceSurface: row.source_surface,
    rawText: row.raw_text,
    rawFilePath: row.raw_file_path,
    rawFileMime: row.raw_file_mime,
    rawFileName: row.raw_file_name,
    parseVersion: row.parse_version,
    warnings: row.warnings || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapItem(row: any): IngestionItemRecord {
  return {
    id: row.id,
    ingestionId: row.ingestion_id,
    position: row.position,
    itemKind: row.item_kind,
    artifactType: row.artifact_type,
    contentRole: row.content_role,
    rawText: row.raw_text,
    parsedMarkdown: row.parsed_markdown,
    title: row.title,
    metadata: row.metadata || {},
    tags: row.tags || [],
    include: row.include,
    createdAt: row.created_at,
  };
}

function mapArtifact(row: any): ArtifactRecord {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    type: row.type,
    rawContent: row.raw_content,
    parsedMarkdown: row.parsed_markdown,
    storagePath: row.storage_path,
    audioUrl: row.audio_url,
    description: row.description,
    metadata: row.metadata || {},
    tags: row.tags || [],
    visibility: row.visibility,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function upsertIngestion(record: IngestionRecord): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("ingestions").upsert({
    id: record.id,
    user_id: record.userId,
    kind: record.kind,
    status: record.status,
    source_provider: record.sourceProvider,
    source_surface: record.sourceSurface,
    raw_text: record.rawText,
    raw_file_path: record.rawFilePath,
    raw_file_mime: record.rawFileMime,
    raw_file_name: record.rawFileName,
    parse_version: record.parseVersion,
    warnings: record.warnings,
    updated_at: new Date().toISOString(),
  });

  if (error) throw error;
}

export async function replaceIngestionItems(
  ingestionId: string,
  items: IngestionItemRecord[],
): Promise<void> {
  const supabase = await createClient();
  
  // Delete existing items for this ingestion
  const { error: deleteError } = await supabase
    .from("ingestion_items")
    .delete()
    .eq("ingestion_id", ingestionId);
    
  if (deleteError) throw deleteError;

  // Insert new items
  const { error: insertError } = await supabase.from("ingestion_items").insert(
    items.map((item) => ({
      id: item.id,
      ingestion_id: item.ingestionId,
      position: item.position,
      item_kind: item.itemKind,
      artifact_type: item.artifactType,
      content_role: item.contentRole,
      raw_text: item.rawText,
      parsed_markdown: item.parsedMarkdown,
      title: item.title,
      metadata: item.metadata,
      tags: item.tags,
      include: item.include,
    })),
  );

  if (insertError) throw insertError;
}

export async function updateIngestionItemRecord(
  ingestionId: string,
  itemId: string,
  updater: (item: IngestionItemRecord) => IngestionItemRecord,
): Promise<IngestionItemRecord | null> {
  const supabase = await createClient();
  
  // Get current item
  const { data: current, error: getError } = await supabase
    .from("ingestion_items")
    .select("*")
    .eq("ingestion_id", ingestionId)
    .eq("id", itemId)
    .single();
    
  if (getError || !current) return null;
  
  const updated = updater(mapItem(current));
  
  const { data: saved, error: updateError } = await supabase
    .from("ingestion_items")
    .update({
      title: updated.title,
      tags: updated.tags,
      include: updated.include,
    })
    .eq("id", itemId)
    .select()
    .single();
    
  if (updateError) throw updateError;
  return mapItem(saved);
}

export async function createArtifactsAndLinks(
  artifacts: ArtifactRecord[],
  links: ArtifactLinkRecord[],
): Promise<void> {
  const supabase = await createClient();
  
  const { error: artifactError } = await supabase.from("artifacts").insert(
    artifacts.map((a) => ({
      id: a.id,
      user_id: a.userId,
      title: a.title,
      type: a.type,
      raw_content: a.rawContent,
      parsed_markdown: a.parsedMarkdown,
      storage_path: a.storagePath,
      audio_url: a.audioUrl,
      description: a.description,
      metadata: a.metadata,
      tags: a.tags,
      visibility: a.visibility,
    })),
  );
  
  if (artifactError) throw artifactError;
  
  if (links.length > 0) {
    const { error: linkError } = await supabase.from("artifact_links").insert(
      links.map((l) => ({
        id: l.id,
        user_id: l.userId,
        from_artifact_id: l.fromArtifactId,
        to_artifact_id: l.toArtifactId,
        relationship_type: l.relationshipType,
        confidence: l.confidence,
        origin: l.origin,
        ingestion_id: l.ingestionId,
      })),
    );
    if (linkError) throw linkError;
  }
}

export async function getIngestionBundle(ingestionId: string): Promise<{
  ingestion: IngestionRecord | null;
  items: IngestionItemRecord[];
}> {
  const supabase = await createClient();
  
  const [ingestionRes, itemsRes] = await Promise.all([
    supabase.from("ingestions").select("*").eq("id", ingestionId).single(),
    supabase.from("ingestion_items").select("*").eq("ingestion_id", ingestionId).order("position"),
  ]);
  
  return {
    ingestion: ingestionRes.data ? mapIngestion(ingestionRes.data) : null,
    items: (itemsRes.data || []).map(mapItem),
  };
}

export async function listIngestions(): Promise<IngestionRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ingestions")
    .select("*")
    .order("updated_at", { ascending: false });
    
  if (error) throw error;
  return (data || []).map(mapIngestion);
}

export async function listArtifacts(search?: string): Promise<ArtifactRecord[]> {
  const supabase = await createClient();
  let query = supabase.from("artifacts").select("*");
  
  if (search) {
    query = query.textSearch("fts", search, {
      type: "websearch",
      config: "english",
    });
  }
  
  const { data, error } = await query.order("updated_at", { ascending: false });
    
  if (error) throw error;
  return (data || []).map(mapArtifact);
}

export function createId(): string {
  return crypto.randomUUID();
}

export function getLocalStoreDir(): string {
  return ""; // Not used for Supabase
}
