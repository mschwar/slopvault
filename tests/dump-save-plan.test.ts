import { describe, expect, test } from "vitest";
import { buildDumpSavePlan } from "@/components/dump/save-plan";
import type { IngestPreviewResponse, IngestMode } from "@/lib/ingest-contract";

function previewWithMode(mode: IngestMode): IngestPreviewResponse {
  return {
    receivedAt: new Date().toISOString(),
    itemCount: 1,
    items: [
      {
        id: "item-1",
        title: "Preview",
        artifactType: "text",
        presentation: "artifact_only",
        summary: "summary",
        metadata: {
          parserVersion: "0.1.0",
          visibility: "private",
        },
        warnings: [],
        classification: {
          mode,
          confidence: "high",
          artifactType: "text",
          reasons: [],
          signals: [],
        },
      },
    ],
    warnings: [],
  };
}

describe("buildDumpSavePlan (/dump save logic)", () => {
  test("forwards audio links to artifact_batch when files are present", () => {
    const actions = buildDumpSavePlan({
      textInput: "https://suno.com/song/mixed123",
      filesCount: 1,
      preview: previewWithMode("audio_link"),
    });

    expect(actions).toEqual([
      {
        type: "artifact_batch",
        includeFiles: true,
        audioLinks: ["https://suno.com/song/mixed123"],
      },
    ]);
  });

  test("creates two ingestions when non-audio text and files are present", () => {
    const actions = buildDumpSavePlan({
      textInput: "Some pasted conversation text",
      filesCount: 2,
      preview: previewWithMode("conversation_paste"),
    });

    expect(actions[0]?.type).toBe("text");
    expect(actions[1]).toEqual({
      type: "artifact_batch",
      includeFiles: true,
      audioLinks: [],
    });
  });

  test("batches conversation items correctly", () => {
    const actions = buildDumpSavePlan({
      textInput: "User: hi\nAssistant: hello",
      filesCount: 0,
      preview: previewWithMode("conversation_paste"),
    });

    expect(actions).toEqual([
      {
        type: "text",
        kind: "conversation_paste",
        rawText: "User: hi\nAssistant: hello",
      }
    ]);
  });
});
