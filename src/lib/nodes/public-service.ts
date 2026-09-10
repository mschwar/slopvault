import { createClient } from "@supabase/supabase-js";
import type { NodeBundle } from "@/lib/ingestions/types";
import { getNodeLineage, type NodeLineage } from "./lineage";

function getPublicClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase environment variables are not configured");
  }
  
  return createClient(supabaseUrl, supabaseAnonKey);
}

export interface PublicNodeBundle extends NodeBundle {
  lineage: NodeLineage;
  authorPseudonym: string;
}

export async function getPublicNodeBundle(nodeId: string): Promise<PublicNodeBundle> {
  const supabase = getPublicClient();
  
  const { data: nodeData, error: nodeError } = await supabase
    .from("nodes")
    .select(`
      *,
      profiles!inner(pseudonym)
    `)
    .eq("id", nodeId)
    .eq("visibility", "public")
    .single();

  if (nodeError || !nodeData) throw new Error("Public node not found");

  const { data: artifactsData, error: artifactsError } = await supabase
    .from("node_artifacts")
    .select("artifacts (*)")
    .eq("node_id", nodeId)
    .order("position");

  if (artifactsError) throw artifactsError;

  // Manual mapping since we aren't using the store's mapArtifact (which is fine)
  const artifacts = (artifactsData || []).map((row: any) => ({
    id: row.artifacts.id,
    userId: row.artifacts.user_id,
    title: row.artifacts.title,
    type: row.artifacts.type,
    rawContent: row.artifacts.raw_content,
    parsedMarkdown: row.artifacts.parsed_markdown,
    storagePath: row.artifacts.storage_path,
    audioUrl: row.artifacts.audio_url,
    description: row.artifacts.description,
    metadata: row.artifacts.metadata || {},
    tags: row.artifacts.tags || [],
    visibility: row.artifacts.visibility,
    createdAt: row.artifacts.created_at,
    updatedAt: row.artifacts.updated_at,
  }));

  // Get lineage information
  const lineage = await getNodeLineage(nodeId);

  return {
    node: {
      id: nodeData.id,
      userId: nodeData.user_id,
      title: nodeData.title,
      description: nodeData.description,
      hook: nodeData.hook,
      parentNodeId: nodeData.parent_node_id,
      visibility: nodeData.visibility,
      upvotes: nodeData.upvotes || 0,
      forkCount: nodeData.fork_count || 0,
      createdAt: nodeData.created_at,
      updatedAt: nodeData.updated_at,
    },
    artifacts,
    lineage,
    authorPseudonym: nodeData.profiles?.pseudonym || "ghost",
  };
}
