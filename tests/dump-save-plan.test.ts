import { describe, expect, test } from "vitest";
import { buildDumpSavePlan } from "@/components/dump/save-plan";
import type { IngestPreviewResponse } from "@/lib/ingest-contract";

function previewWithMode(mode: string): IngestPreviewResponse {
  return {
    items: [
      {
        id: "item-1",
        position: 0,
        artifactType: "text",
        contentRole: "artifact",
        title: "Preview",
        rawText: "",
        parsedMarkdown: "",
        tags: [],
        defaultInclude: true,
        classification: {
          mode,
          confidence: "high",
          provider: null,
          surface: null,
          notes: [],
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
});

