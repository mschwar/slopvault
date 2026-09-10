import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { extractItems } from "@/lib/ingestions/extract";
import type { IngestionKind, SourceProvider } from "@/lib/ingestions/types";

const FIXTURE_DIR = path.join(process.cwd(), "tests", "fixtures");

const cases = [
  "openai_chatgpt_web",
  "anthropic_claude_web_desktop",
  "gemini_web",
  "xai_grok_web",
  "openai_codex_cli",
  "anthropic_claude_code",
  "gemini_ai_studio",
] as const;

describe("extractItems", () => {
  test.each(cases)("extracts %s into expected staged roles", async (fixtureName) => {
    const raw = await readFile(path.join(FIXTURE_DIR, `${fixtureName}.raw.txt`), "utf8");
    const gold = JSON.parse(
      await readFile(path.join(FIXTURE_DIR, `${fixtureName}.gold.json`), "utf8"),
    ) as {
      kind: IngestionKind;
      providerHint: SourceProvider | "auto";
      expectedProvider: SourceProvider;
      expectedSurface: string;
      expectedRoles: string[];
    };

    const result = await extractItems({
      kind: gold.kind,
      rawText: raw,
      sourceProviderHint: gold.providerHint,
    });

    expect(result.sourceProvider).toBe(gold.expectedProvider);
    expect(result.sourceSurface).toBe(gold.expectedSurface);
    expect(result.items.map((item) => item.contentRole)).toEqual(gold.expectedRoles);
  });

  test("caps artifact batches at 10 total items", async () => {
    const result = await extractItems({
      kind: "artifact_batch",
      files: [],
      audioLinks: Array.from({ length: 12 }, (_, index) => `https://audio.example/${index}`),
    });

    expect(result.items).toHaveLength(10);
    expect(result.warnings[0]).toContain("capped at 10");
  });
});
