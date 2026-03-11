import { mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { beforeEach, describe, expect, test } from "vitest";
import {
  analyzeIngestion,
  commitIngestion,
  createIngestionDraft,
  discardIngestion,
  getDashboardSnapshot,
  getIngestion,
  updateIngestionItem,
} from "@/lib/ingestions/service";

describe("ingestion service flow", () => {
  beforeEach(async () => {
    process.env.SLOPVAULT_STORE_DIR = await mkdtemp(
      path.join(os.tmpdir(), "slopvault-tests-"),
    );
  });

  test("creates, analyzes, edits, commits, and links a conversation ingest", async () => {
    const draft = await createIngestionDraft({
      kind: "conversation_paste",
      sourceProviderHint: "openai",
    });

    const analyzed = await analyzeIngestion(draft.id, {
      rawText:
        "What is SlopVault?\n\nThought for 5s\nSlopVault is an artifact-first vault that preserves provenance.",
      sourceProviderHint: "openai",
    });

    expect(analyzed.items).toHaveLength(2);
    expect(analyzed.ingestion.status).toBe("analyzed");

    const promptItem = analyzed.items[0];
    await updateIngestionItem(draft.id, promptItem.id, {
      title: "Opening prompt",
      tags: ["seed", "research"],
    });

    const committed = await commitIngestion(draft.id);
    expect(committed.ingestion.status).toBe("committed");
    expect(committed.artifacts).toHaveLength(2);
    expect(committed.links).toHaveLength(1);
    expect(committed.links[0].relationshipType).toBe("prompt_to_response");

    const snapshot = await getDashboardSnapshot();
    expect(snapshot.artifacts).toHaveLength(2);
    expect(snapshot.ingestions[0].status).toBe("committed");
  });

  test("stores prompt-only ingests as prompt-role text artifacts", async () => {
    const draft = await createIngestionDraft({
      kind: "prompt_only",
    });

    await analyzeIngestion(draft.id, {
      rawText: "Create a vault-first ingestion UX for AI rabbit holes.",
    });

    const committed = await commitIngestion(draft.id);
    expect(committed.artifacts).toHaveLength(1);
    expect(committed.artifacts[0].type).toBe("text");
    expect(committed.artifacts[0].metadata.content_role).toBe("prompt");
  });

  test("discards drafts without creating artifacts", async () => {
    const draft = await createIngestionDraft({
      kind: "prompt_only",
    });

    await analyzeIngestion(draft.id, {
      rawText: "A disposable prompt draft.",
    });

    await discardIngestion(draft.id);

    const bundle = await getIngestion(draft.id);
    expect(bundle.ingestion?.status).toBe("discarded");

    const snapshot = await getDashboardSnapshot();
    expect(snapshot.artifacts).toHaveLength(0);
  });
});
