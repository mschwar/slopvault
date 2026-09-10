import { describe, expect, test, vi, beforeEach } from "vitest";
import { createNode, deleteNode, getNodeBundle, listMyNodes, updateNode } from "@/lib/nodes/service";

// Mock Supabase Server Client
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: { id: "test-user-id" } }, error: null })),
    },
    from: vi.fn((table) => ({
      select: vi.fn((sel) => ({
        eq: vi.fn((col, val) => ({
          single: vi.fn(() => {
            if (table === "nodes") return Promise.resolve({ data: { id: val, user_id: "test-user-id", title: "Test Node", visibility: "private" }, error: null });
            return Promise.resolve({ data: null, error: null });
          }),
          order: vi.fn(() => {
            if (table === "nodes") return Promise.resolve({ data: [{ id: "1", user_id: "test-user-id", title: "Node 1", visibility: "private" }], error: null });
            if (table === "node_artifacts") return Promise.resolve({ data: [{ artifacts: { id: "a1", type: "text", title: "A1" } }], error: null });
            return Promise.resolve({ data: [], error: null });
          }),
        })),
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: { id: "new-node-id", user_id: "test-user-id", title: "New Node" }, error: null })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: { id: "node-id", title: "Updated Title", visibility: "public" }, error: null })),
          })),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
  })),
}));

describe("Node service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("lists user nodes", async () => {
    const nodes = await listMyNodes();
    expect(nodes).toHaveLength(1);
    expect(nodes[0].title).toBe("Node 1");
  });

  test("creates a node", async () => {
    const node = await createNode({
      title: "New Node",
      artifactIds: ["a1", "a2"],
    });
    expect(node.id).toBe("new-node-id");
    expect(node.title).toBe("New Node");
  });

  test("updates a node", async () => {
    const node = await updateNode("node-id", {
      title: "Updated Title",
      visibility: "public",
    });
    expect(node.title).toBe("Updated Title");
    expect(node.visibility).toBe("public");
  });

  test("gets a node bundle", async () => {
    const bundle = await getNodeBundle("node-id");
    expect(bundle.node.title).toBe("Test Node");
    expect(bundle.artifacts).toHaveLength(1);
    expect(bundle.artifacts[0].title).toBe("A1");
  });
});
