import { createClient } from "@supabase/supabase-js";
import type { NodeRecord } from "@/lib/ingestions/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function getPublicClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase environment variables are not configured");
  }
  return createClient(supabaseUrl, supabaseAnonKey);
}

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

export interface LineageNode {
  id: string;
  title: string;
  pseudonym: string;
  upvotes: number;
  forkCount: number;
  createdAt: string;
}

export interface NodeLineage {
  parent: LineageNode | null;
  children: LineageNode[];
  siblings: LineageNode[]; // Other forks of the same parent
  depth: number; // Depth in the fork tree
}

/**
 * Get the lineage (parent and children) for a node.
 * Limited depth to prevent performance issues.
 */
export async function getNodeLineage(nodeId: string): Promise<NodeLineage> {
  const supabase = getPublicClient();
  
  // Get the current node to find its parent
  const { data: currentNode, error: currentError } = await supabase
    .from("nodes")
    .select("parent_node_id, user_id")
    .eq("id", nodeId)
    .single();
  
  if (currentError || !currentNode) {
    throw new Error("Node not found");
  }
  
  // Get parent if exists
  let parent: LineageNode | null = null;
  if (currentNode.parent_node_id) {
    const { data: parentData } = await supabase
      .from("nodes")
      .select(`
        id,
        title,
        upvotes,
        fork_count,
        created_at,
        profiles!inner(pseudonym)
      `)
      .eq("id", currentNode.parent_node_id)
      .eq("visibility", "public")
      .single();
    
    if (parentData) {
      // Handle both array and object return types from Supabase
      const profileData = Array.isArray(parentData.profiles) 
        ? parentData.profiles[0] 
        : parentData.profiles;
      parent = {
        id: parentData.id,
        title: parentData.title,
        pseudonym: profileData?.pseudonym || "ghost",
        upvotes: parentData.upvotes || 0,
        forkCount: parentData.fork_count || 0,
        createdAt: parentData.created_at,
      };
    }
  }
  
  // Get children (forks of this node)
  const { data: childrenData } = await supabase
    .from("nodes")
    .select(`
      id,
      title,
      upvotes,
      fork_count,
      created_at,
      profiles!inner(pseudonym)
    `)
    .eq("parent_node_id", nodeId)
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .limit(10); // Limit to prevent overload
  
  const children: LineageNode[] = (childrenData || []).map((row: any) => {
    const profileData = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    return {
      id: row.id,
      title: row.title,
      pseudonym: profileData?.pseudonym || "ghost",
      upvotes: row.upvotes || 0,
      forkCount: row.fork_count || 0,
      createdAt: row.created_at,
    };
  });
  
  // Get siblings (other forks of the same parent)
  let siblings: LineageNode[] = [];
  if (currentNode.parent_node_id) {
    const { data: siblingsData } = await supabase
      .from("nodes")
      .select(`
        id,
        title,
        upvotes,
        fork_count,
        created_at,
        profiles!inner(pseudonym)
      `)
      .eq("parent_node_id", currentNode.parent_node_id)
      .neq("id", nodeId) // Exclude current node
      .eq("visibility", "public")
      .order("created_at", { ascending: false })
      .limit(10);
    
    siblings = (siblingsData || []).map((row: any) => {
      const profileData = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      return {
        id: row.id,
        title: row.title,
        pseudonym: profileData?.pseudonym || "ghost",
        upvotes: row.upvotes || 0,
        forkCount: row.fork_count || 0,
        createdAt: row.created_at,
      };
    });
  }
  
  // Calculate depth by traversing up the tree
  let depth = 0;
  let currentParentId = currentNode.parent_node_id;
  while (currentParentId) {
    depth++;
    const { data: parentRow } = await supabase
      .from("nodes")
      .select("parent_node_id")
      .eq("id", currentParentId)
      .single();
    currentParentId = parentRow?.parent_node_id;
  }
  
  return {
    parent,
    children,
    siblings,
    depth,
  };
}

/**
 * Get the full fork tree starting from a root node.
 * Limited to a maximum depth to prevent performance issues.
 */
export async function getForkTree(
  rootNodeId: string,
  maxDepth: number = 5
): Promise<{ node: LineageNode; children: any[] } | null> {
  const supabase = getPublicClient();
  
  async function fetchTree(nodeId: string, depth: number): Promise<any> {
    if (depth > maxDepth) return null;
    
    const { data: node } = await supabase
      .from("nodes")
      .select(`
        id,
        title,
        upvotes,
        fork_count,
        created_at,
        profiles!inner(pseudonym)
      `)
      .eq("id", nodeId)
      .eq("visibility", "public")
      .single();
    
    if (!node) return null;
    
    const { data: children } = await supabase
      .from("nodes")
      .select("id")
      .eq("parent_node_id", nodeId)
      .eq("visibility", "public")
      .order("created_at", { ascending: false });
    
    const childTrees = await Promise.all(
      (children || []).map((child) => fetchTree(child.id, depth + 1))
    );
    
    const profileData = Array.isArray(node.profiles) ? node.profiles[0] : node.profiles;
    return {
      node: {
        id: node.id,
        title: node.title,
        pseudonym: profileData?.pseudonym || "ghost",
        upvotes: node.upvotes || 0,
        forkCount: node.fork_count || 0,
        createdAt: node.created_at,
      },
      children: childTrees.filter(Boolean),
    };
  }
  
  return fetchTree(rootNodeId, 0);
}

/**
 * Find the root of a fork tree (the original ancestor).
 */
export async function findForkRoot(nodeId: string): Promise<string | null> {
  const supabase = getPublicClient();
  
  let currentId = nodeId;
  let iterations = 0;
  const maxIterations = 20; // Safety limit
  
  while (iterations < maxIterations) {
    const { data } = await supabase
      .from("nodes")
      .select("parent_node_id")
      .eq("id", currentId)
      .single();
    
    if (!data?.parent_node_id) {
      return currentId;
    }
    
    currentId = data.parent_node_id;
    iterations++;
  }
  
  return null; // Likely a circular reference or too deep
}
