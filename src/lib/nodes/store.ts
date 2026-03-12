import { createClient } from "@/lib/supabase/server";
import type {
  ArtifactRecord,
  NodeArtifactRecord,
  NodeRecord,
} from "@/lib/ingestions/types";

function mapNode(row: any): NodeRecord {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    hook: row.hook,
    parentNodeId: row.parent_node_id,
    visibility: row.visibility,
    upvotes: row.upvotes || 0,
    forkCount: row.fork_count || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
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

export async function createNodeRecord(input: {
  userId: string;
  title: string;
  description?: string;
  hook?: string;
  artifactIds: string[];
  parentNodeId?: string;
}): Promise<NodeRecord> {
  const supabase = await createClient();

  const { data: nodeData, error: nodeError } = await supabase
    .from("nodes")
    .insert({
      user_id: input.userId,
      title: input.title,
      description: input.description,
      hook: input.hook,
      parent_node_id: input.parentNodeId,
    })
    .select()
    .single();

  if (nodeError) throw nodeError;
  const node = mapNode(nodeData);

  if (input.artifactIds.length > 0) {
    const { error: artifactsError } = await supabase
      .from("node_artifacts")
      .insert(
        input.artifactIds.map((artifactId, index) => ({
          node_id: node.id,
          artifact_id: artifactId,
          position: index,
        })),
      );
    if (artifactsError) throw artifactsError;
  }

  return node;
}

export async function getNodeRecord(nodeId: string): Promise<NodeRecord | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("nodes")
    .select("*")
    .eq("id", nodeId)
    .single();

  if (error || !data) return null;
  return mapNode(data);
}

export async function listUserNodes(userId: string): Promise<NodeRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("nodes")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data || []).map(mapNode);
}

export async function getNodeArtifacts(nodeId: string): Promise<ArtifactRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("node_artifacts")
    .select("artifacts (*)")
    .eq("node_id", nodeId)
    .order("position");

  if (error) throw error;
  return (data || []).map((row: any) => mapArtifact(row.artifacts));
}

export async function updateNodeRecord(
  nodeId: string,
  input: {
    title?: string;
    description?: string | null;
    hook?: string | null;
    visibility?: "private" | "public";
  },
): Promise<NodeRecord> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("nodes")
    .update({
      title: input.title,
      description: input.description,
      hook: input.hook,
      visibility: input.visibility,
      updated_at: new Date().toISOString(),
    })
    .eq("id", nodeId)
    .select()
    .single();

  if (error) throw error;
  return mapNode(data);
}

export async function replaceNodeArtifacts(
  nodeId: string,
  artifactIds: string[],
): Promise<void> {
  const supabase = await createClient();
  
  const { error: deleteError } = await supabase
    .from("node_artifacts")
    .delete()
    .eq("node_id", nodeId);
    
  if (deleteError) throw deleteError;

  if (artifactIds.length > 0) {
    const { error: insertError } = await supabase
      .from("node_artifacts")
      .insert(
        artifactIds.map((artifactId, index) => ({
          node_id: nodeId,
          artifact_id: artifactId,
          position: index,
        })),
      );
    if (insertError) throw insertError;
  }
}

export async function deleteNodeRecord(nodeId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("nodes").delete().eq("id", nodeId);
  if (error) throw error;
}
