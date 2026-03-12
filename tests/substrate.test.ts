import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { extractItems } from "@/lib/ingestions/extract";

const DUMP_DIR = path.join(process.cwd(), "dump");

async function readDumpFile(filename: string): Promise<string> {
  return readFile(path.join(DUMP_DIR, filename), "utf8");
}

describe("Substrate corpus samples (repo dump/)", () => {
  test("gemini-raw-seed.md extracts prompt/response and detects Google surface", async () => {
    const raw = await readDumpFile("gemini-raw-seed.md");
    const result = await extractItems({
      kind: "conversation_paste",
      rawText: raw,
      sourceProviderHint: "auto",
    });

    expect(result.sourceProvider).toBe("google");
    expect(result.sourceSurface).toBe("gemini-web");
    expect(result.items.map((item) => item.contentRole)).toEqual([
      "prompt",
      "response",
    ]);
    expect(result.items[0]?.parsedMarkdown?.length).toBeGreaterThan(10);
    expect(result.items[1]?.parsedMarkdown?.length).toBeGreaterThan(10);
  });

  test.each([
    "GPT-firstpass.md",
    "Grok-firstpass.md",
  ])("%s extracts at least one item (non-empty)", async (filename) => {
    const raw = await readDumpFile(filename);
    const result = await extractItems({
      kind: "conversation_paste",
      rawText: raw,
      sourceProviderHint: "auto",
    });

    expect(result.items.length).toBeGreaterThan(0);
    for (const item of result.items) {
      expect(item.parsedMarkdown.length).toBeGreaterThan(10);
      expect(item.metadata.content_role).toBe(item.contentRole);
    }
  });
});

