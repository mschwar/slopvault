import { describe, expect, it } from "vitest";
import { buildIngestPreview, previewFileDescriptor, previewTextInput } from "@/lib/ingest";

describe("ingest classification", () => {
  it("classifies ChatGPT-style conversation paste", () => {
    const preview = previewTextInput(`
Thought for 2m 49s
User: What percentage of world GDP relies on semiconductors?
Assistant: Estimates vary, but semiconductors are foundational to a large share of modern GDP...
`);

    expect(preview).not.toBeNull();
    expect(preview?.classification.mode).toBe("conversation_paste");
    expect(preview?.classification.provider).toBe("chatgpt");
    expect(preview?.presentation).toBe("prompt_and_output");
  });

  it("classifies prompt-only text", () => {
    const preview = previewTextInput(
      "Write a concise outline for a research rabbit hole about semiconductor supply chains."
    );

    expect(preview).not.toBeNull();
    expect(preview?.classification.mode).toBe("standalone_prompt");
    expect(preview?.promptPreview).toContain("Write a concise outline");
  });

  it("classifies audio URLs", () => {
    const preview = previewTextInput("https://suno.com/song/abc123");

    expect(preview).not.toBeNull();
    expect(preview?.classification.mode).toBe("audio_link");
    expect(preview?.artifactType).toBe("audio_link");
  });

  it("classifies provider export JSON", () => {
    const preview = previewTextInput(
      JSON.stringify([
        {
          title: "Substrate brainstorm",
          conversation_id: "conv_123",
          mapping: {}
        }
      ])
    );

    expect(preview).not.toBeNull();
    expect(preview?.classification.mode).toBe("provider_export_json");
    expect(preview?.classification.provider).toBe("chatgpt");
  });

  it("classifies image uploads as standalone artifacts", () => {
    const preview = previewFileDescriptor({
      name: "artifact.png",
      type: "image/png",
      size: 2048
    });

    expect(preview).not.toBeNull();
    expect(preview?.artifactType).toBe("image");
    expect(preview?.classification.mode).toBe("standalone_artifact");
  });

  it("builds a combined preview for text and files", () => {
    const preview = buildIngestPreview({
      textInput: "Act as a brutalist product archivist and write a better hook.",
      files: [
        {
          name: "artifact.txt",
          type: "text/plain",
          size: 64,
          textContent: "This is a standalone artifact body."
        }
      ]
    });

    expect(preview.itemCount).toBe(2);
    expect(preview.items[0]?.classification.mode).toBe("standalone_prompt");
    expect(preview.items[1]?.classification.mode).toBe("standalone_artifact");
  });
});
