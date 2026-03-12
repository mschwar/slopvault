import { createClient } from "@supabase/supabase-js";
import { getNodeArtifacts, getNodeRecord } from "@/lib/nodes/store";
import type { NodeBundle } from "@/lib/ingestions/types";

// Note: Using a non-auth-wrapped client for public reads if needed, 
// but store.ts uses createClient from @/lib/supabase/server which gets current user.
// For public views, we need a service that doesn't require a logged in user.

// I'll create a dedicated public client for this.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const publicClient = createClient(supabaseUrl, supabaseAnonKey);

export async function getPublicNodeBundle(nodeId: string): Promise<NodeBundle> {
  const { data: nodeData, error: nodeError } = await publicClient
    .from("nodes")
    .select("*")
    .eq("id", nodeId)
    .eq("visibility", "public")
    .single();

  if (nodeError || !nodeData) throw new Error("Public node not found");

  const { data: artifactsData, error: artifactsError } = await publicClient
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
  };
}
