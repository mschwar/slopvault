import { mkdtemp, writeFile } from "node:fs/promises";
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
  uploadIngestionSource,
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

  test("audio-link-only ingest creates audio_link artifacts without data loss", async () => {
    const draft = await createIngestionDraft({
      kind: "artifact_batch",
    });

    const audioLinks = [
      "https://suno.com/song/abc123",
      "https://udio.com/track/xyz789",
    ];

    const analyzed = await analyzeIngestion(draft.id, {
      audioLinks,
    });

    expect(analyzed.items).toHaveLength(2);
    expect(analyzed.items[0]?.artifactType).toBe("audio_link");
    expect(analyzed.items[1]?.artifactType).toBe("audio_link");
    expect(analyzed.items[0]?.metadata.original_url).toBe(audioLinks[0]);
    expect(analyzed.items[1]?.metadata.original_url).toBe(audioLinks[1]);

    const committed = await commitIngestion(draft.id);
    expect(committed.artifacts).toHaveLength(2);
    expect(committed.artifacts[0]?.type).toBe("audio_link");
    expect(committed.artifacts[0]?.audioUrl).toBe(audioLinks[0]);
    expect(committed.artifacts[1]?.audioUrl).toBe(audioLinks[1]);
  });

  test("artifact batch with files and audio links extracts both without data loss", async () => {
    const draft = await createIngestionDraft({
      kind: "artifact_batch",
    });

    // Create a temporary text file to upload
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "slopvault-upload-"));
    const testFilePath = path.join(tempDir, "test-artifact.txt");
    await writeFile(testFilePath, "This is a standalone text artifact.");

    // Create a mock File object and override arrayBuffer for uploadIngestionSource
    const fileBuffer = Buffer.from("This is a standalone text artifact.");
    const mockFile = {
      name: "test-artifact.txt",
      type: "text/plain",
      size: fileBuffer.length,
      arrayBuffer: async () => fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength),
    } as File;

    const uploaded = await uploadIngestionSource(draft.id, [mockFile]);
    expect(uploaded).toHaveLength(1);

    const audioLinks = ["https://suno.com/song/mixed123"];

    const analyzed = await analyzeIngestion(draft.id, {
      audioLinks,
    }, uploaded);

    // Should have 2 items: 1 file + 1 audio link
    expect(analyzed.items).toHaveLength(2);
    expect(analyzed.items[0]?.artifactType).toBe("text");
    expect(analyzed.items[0]?.contentRole).toBe("artifact");
    expect(analyzed.items[1]?.artifactType).toBe("audio_link");
    expect(analyzed.items[1]?.metadata.original_url).toBe(audioLinks[0]);

    const committed = await commitIngestion(draft.id);
    expect(committed.artifacts).toHaveLength(2);
    expect(committed.links).toHaveLength(1);
  });
});
