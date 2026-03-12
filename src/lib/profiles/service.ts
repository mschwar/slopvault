import { createClient } from "@supabase/supabase-js";

function getPublicClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase environment variables are not configured");
  }
  
  return createClient(supabaseUrl, supabaseAnonKey);
}

export interface UserProfile {
  id: string;
  pseudonym: string;
  createdAt: string;
}

export interface UserNode {
  id: string;
  title: string;
  hook: string | null;
  upvotes: number;
  forkCount: number;
  createdAt: string;
  mediaTypes: string[];
}

export interface UserProfileResult {
  profile: UserProfile;
  nodes: UserNode[];
  nodeCount: number;
}

/**
 * Get a user's public profile and their published nodes.
 */
export async function getUserProfile(
  pseudonym: string
): Promise<UserProfileResult | null> {
  // Get profile
  const { data: profile, error: profileError } = await getPublicClient()
    .from("profiles")
    .select("id, pseudonym, created_at")
    .eq("pseudonym", pseudonym)
    .single();

  if (profileError || !profile) {
    return null;
  }

  // Get public nodes for this user
  const { data: nodes, error: nodesError } = await getPublicClient()
    .from("nodes")
    .select(`
      id,
      title,
      hook,
      upvotes,
      fork_count,
      created_at,
      node_artifacts(artifacts(type))
    `)
    .eq("user_id", profile.id)
    .eq("visibility", "public")
    .order("created_at", { ascending: false });

  if (nodesError) {
    throw nodesError;
  }

  const mappedNodes: UserNode[] = (nodes || []).map((row: any) => {
    const mediaTypesSet = new Set<string>();
    if (row.node_artifacts) {
      row.node_artifacts.forEach((na: any) => {
        if (na.artifacts?.type) {
          mediaTypesSet.add(na.artifacts.type);
        }
      });
    }

    return {
      id: row.id,
      title: row.title,
      hook: row.hook,
      upvotes: row.upvotes || 0,
      forkCount: row.fork_count || 0,
      createdAt: row.created_at,
      mediaTypes: Array.from(mediaTypesSet),
    };
  });

  return {
    profile: {
      id: profile.id,
      pseudonym: profile.pseudonym,
      createdAt: profile.created_at,
    },
    nodes: mappedNodes,
    nodeCount: mappedNodes.length,
  };
}
