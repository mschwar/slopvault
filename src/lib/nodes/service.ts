import { createClient } from "@/lib/supabase/server";
import {
  createNodeRecord,
  deleteNodeRecord,
  getNodeArtifacts,
  getNodeRecord,
  listUserNodes,
  replaceNodeArtifacts,
  updateNodeRecord,
} from "@/lib/nodes/store";
import type {
  ArtifactRecord,
  CreateNodeInput,
  NodeBundle,
  NodeRecord,
  UpdateNodeInput,
} from "@/lib/ingestions/types";

async function getUserId(): Promise<string> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Unauthorized");
  return user.id;
}

export async function createNode(input: CreateNodeInput): Promise<NodeRecord> {
  const userId = await getUserId();
  return createNodeRecord({
    userId,
    title: input.title,
    description: input.description,
    hook: input.hook,
    artifactIds: input.artifactIds,
  });
}

export async function getNodeBundle(nodeId: string): Promise<NodeBundle> {
  const node = await getNodeRecord(nodeId);
  if (!node) throw new Error("Node not found");

  const artifacts = await getNodeArtifacts(nodeId);
  return { node, artifacts };
}

export async function listMyNodes(): Promise<NodeRecord[]> {
  const userId = await getUserId();
  return listUserNodes(userId);
}

export async function updateNode(
  nodeId: string,
  input: UpdateNodeInput,
): Promise<NodeRecord> {
  const userId = await getUserId();
  const node = await getNodeRecord(nodeId);
  if (!node) throw new Error("Node not found");
  if (node.userId !== userId) throw new Error("Unauthorized");

  const updatedNode = await updateNodeRecord(nodeId, {
    title: input.title,
    description: input.description,
    hook: input.hook,
    visibility: input.visibility,
  });

  if (input.artifactIds) {
    await replaceNodeArtifacts(nodeId, input.artifactIds);
  }

  return updatedNode;
}

export async function deleteNode(nodeId: string): Promise<void> {
  const userId = await getUserId();
  const node = await getNodeRecord(nodeId);
  if (!node) throw new Error("Node not found");
  if (node.userId !== userId) throw new Error("Unauthorized");

  await deleteNodeRecord(nodeId);
}

/**
 * Duplicate artifacts for a forked node.
 * Creates new artifact records owned by the forking user.
 */
async function duplicateArtifacts(
  artifacts: ArtifactRecord[],
  userId: string,
): Promise<string[]> {
  const supabase = await createClient();
  const newArtifactIds: string[] = [];

  for (const artifact of artifacts) {
    const { data, error } = await supabase
      .from("artifacts")
      .insert({
        user_id: userId,
        title: artifact.title,
        type: artifact.type,
        raw_content: artifact.rawContent,
        parsed_markdown: artifact.parsedMarkdown,
        storage_path: artifact.storagePath,
        audio_url: artifact.audioUrl,
        description: artifact.description,
        metadata: {
          ...artifact.metadata,
          forked_from: artifact.id,
          forked_at: new Date().toISOString(),
        },
        tags: artifact.tags,
        visibility: "private", // Forked artifacts start private
      })
      .select("id")
      .single();

    if (error) throw error;
    newArtifactIds.push(data.id);
  }

  return newArtifactIds;
}

export async function forkNode(nodeId: string): Promise<NodeRecord> {
  const userId = await getUserId();
  
  // Get the source node
  const sourceNode = await getNodeRecord(nodeId);
  if (!sourceNode) throw new Error("Node not found");
  if (sourceNode.visibility !== "public") throw new Error("Cannot fork private nodes");
  
  // Get the source artifacts
  const sourceArtifacts = await getNodeArtifacts(nodeId);
  
  // Duplicate the artifacts for the fork (don't just reference them)
  // This ensures the fork owns its own copy and won't break if source is deleted
  const forkedArtifactIds = await duplicateArtifacts(sourceArtifacts, userId);
  
  // Create the forked node
  const forkedNode = await createNodeRecord({
    userId,
    title: `${sourceNode.title} (fork)`,
    description: sourceNode.description ?? undefined,
    hook: sourceNode.hook ?? undefined,
    artifactIds: forkedArtifactIds,
    parentNodeId: nodeId,
  });
  
  return forkedNode;
}
