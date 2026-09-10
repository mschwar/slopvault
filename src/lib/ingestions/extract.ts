import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  buildPromptFamilyFingerprint,
  buildPromptFingerprint,
} from "@/lib/ingestions/fingerprints";
import type {
  ArtifactType,
  ContentRole,
  ExtractedItem,
  ExtractionResult,
  IngestionKind,
  MetadataRecord,
  SourceProvider,
  UploadedFileReference,
} from "@/lib/ingestions/types";

export const PARSE_VERSION = "1.0.0";

const PROVIDER_LABELS: Record<SourceProvider, string> = {
  openai: "openai",
  google: "google",
  anthropic: "anthropic",
  xai: "xai",
  unknown: "unknown",
};

function normalizeText(raw: string): string {
  return raw.replace(/\r\n/g, "\n").trim();
}

function toMarkdown(raw: string): string {
  return normalizeText(raw)
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n");
}

function createTitle(content: string, fallback: string): string {
  const firstLine = normalizeText(content).split("\n")[0]?.trim();
  if (!firstLine) {
    return fallback;
  }
  return firstLine.length > 72 ? `${firstLine.slice(0, 69)}...` : firstLine;
}

function createTextItem(params: {
  position: number;
  rawText: string;
  contentRole: ContentRole;
  titleFallback: string;
  metadata?: MetadataRecord;
}): ExtractedItem {
  const rawText = normalizeText(params.rawText);
  const parsedMarkdown = toMarkdown(rawText);
  const metadata: MetadataRecord = {
    ...(params.metadata ?? {}),
    content_role: params.contentRole,
  };

  if (params.contentRole === "prompt") {
    metadata.prompt_fingerprint = buildPromptFingerprint(rawText);
    metadata.prompt_family_fingerprint = buildPromptFamilyFingerprint(rawText);
  }

  return {
    position: params.position,
    artifactType: "text",
    contentRole: params.contentRole,
    rawText,
    parsedMarkdown,
    title: createTitle(rawText, params.titleFallback),
    metadata,
    tags: [],
    defaultInclude: true,
  };
}

function detectProvider(
  rawText: string,
  providerHint?: SourceProvider | "auto",
): SourceProvider {
  if (providerHint && providerHint !== "auto") {
    return providerHint;
  }

  if (
    rawText.includes("Expand to view model thoughts") ||
    rawText.includes("gstatic.com/aistudio/watermark")
  ) {
    return "google";
  }
  if (/Thought for \d+m \d+s/i.test(rawText) || rawText.includes("chat.html")) {
    return "openai";
  }
  if (rawText.includes('"toolu_') || rawText.includes("Claude Code")) {
    return "anthropic";
  }
  if (rawText.includes("grok.com") || rawText.includes("Grok")) {
    return "xai";
  }
  return "unknown";
}

function inferSurface(
  kind: IngestionKind,
  provider: SourceProvider,
  rawText: string,
  surfaceHint?: string,
): string {
  if (surfaceHint?.trim()) {
    return surfaceHint.trim();
  }

  if (kind === "prompt_only") {
    return "prompt-only";
  }
  if (kind === "artifact_batch") {
    return "artifact-batch";
  }
  if (kind === "source_json_upload" && provider === "openai") {
    return "codex-cli";
  }
  if (kind === "source_json_upload" && provider === "anthropic") {
    return "claude-code";
  }
  if (provider === "openai") {
    return rawText.includes('"type":"response_item"')
      ? "codex-cli"
      : "chatgpt-web";
  }
  if (provider === "google") {
    return rawText.includes("aistudio.google.com")
      ? "gemini-ai-studio"
      : "gemini-web";
  }
  if (provider === "anthropic") {
    return rawText.includes('"toolu_')
      ? "claude-code"
      : "claude-web-desktop";
  }
  if (provider === "xai") {
    return rawText.includes("x.com") ? "grok-in-x" : "grok-web";
  }
  return kind;
}

function fallbackConversationExtraction(rawText: string): ExtractedItem[] {
  const normalized = normalizeText(rawText);
  const paragraphs = normalized.split(/\n\s*\n/).filter(Boolean);
  if (paragraphs.length >= 2 && paragraphs[0].length < 500) {
    return [
      createTextItem({
        position: 0,
        rawText: paragraphs[0],
        contentRole: "prompt",
        titleFallback: "Prompt",
      }),
      createTextItem({
        position: 1,
        rawText: paragraphs.slice(1).join("\n\n"),
        contentRole: "response",
        titleFallback: "Response",
      }),
    ];
  }

  return [
    createTextItem({
      position: 0,
      rawText: normalized,
      contentRole: "response",
      titleFallback: "Imported text artifact",
    }),
  ];
}

function extractOpenAIChat(rawText: string): ExtractedItem[] {
  const normalized = normalizeText(rawText);
  const regex =
    /([\s\S]*?)\n\nThought for [^\n]+\n([\s\S]*?)(?=(?:\n\n[\s\S]*?\n\nThought for [^\n]+\n)|$)/g;
  const items: ExtractedItem[] = [];
  let match: RegExpExecArray | null;
  let position = 0;

  while ((match = regex.exec(normalized)) !== null) {
    const prompt = normalizeText(match[1]);
    const response = normalizeText(match[2]);
    if (prompt) {
      items.push(
        createTextItem({
          position: position++,
          rawText: prompt,
          contentRole: "prompt",
          titleFallback: "Prompt",
        }),
      );
    }
    if (response) {
      items.push(
        createTextItem({
          position: position++,
          rawText: response,
          contentRole: "response",
          titleFallback: "Response",
          metadata: {
            reasoning_present_in_paste: true,
          },
        }),
      );
    }
  }

  return items.length > 0 ? items : fallbackConversationExtraction(rawText);
}

function extractGeminiText(rawText: string): ExtractedItem[] {
  const cleaned = normalizeText(rawText)
    .replace(/!\[Thinking\]\([^)]+\)Thoughts/gi, "")
    .replace(/Expand to view model thoughts/gi, "")
    .replace(/chevron_right/gi, "")
    .trim();

  const userMatch = cleaned.match(/User[^\n]*\n([\s\S]*?)\n\nModel[^\n]*\n([\s\S]*)/);
  if (userMatch) {
    return [
      createTextItem({
        position: 0,
        rawText: userMatch[1],
        contentRole: "prompt",
        titleFallback: "Prompt",
      }),
      createTextItem({
        position: 1,
        rawText: userMatch[2],
        contentRole: "response",
        titleFallback: "Response",
        metadata: {
          reasoning_present_in_paste: true,
        },
      }),
    ];
  }

  return fallbackConversationExtraction(cleaned);
}

function extractClaudeCodeJsonl(rawText: string): ExtractedItem[] {
  const lines = normalizeText(rawText)
    .split("\n")
    .filter(Boolean);
  const items: ExtractedItem[] = [];
  let position = 0;

  for (const line of lines) {
    try {
      const parsed = JSON.parse(line) as {
        type?: string;
        message?: {
          role?: string;
          content?: string | Array<{ type?: string; text?: string; thinking?: string }>;
        };
        data?: { fullOutput?: string };
      };

      if (parsed.type === "user" && parsed.message?.content) {
        items.push(
          createTextItem({
            position: position++,
            rawText: String(parsed.message.content),
            contentRole: "prompt",
            titleFallback: "Prompt",
          }),
        );
      }

      if (parsed.type === "assistant" && parsed.message?.content) {
        const blocks = Array.isArray(parsed.message.content)
          ? parsed.message.content
          : [{ type: "text", text: String(parsed.message.content) }];
        const responseText = blocks
          .map((block) => block.text ?? block.thinking ?? "")
          .filter(Boolean)
          .join("\n\n");

        if (responseText) {
          items.push(
            createTextItem({
              position: position++,
              rawText: responseText,
              contentRole: "response",
              titleFallback: "Response",
              metadata: {
                reasoning_present_in_paste: blocks.some(
                  (block) => typeof block.thinking === "string",
                ),
              },
            }),
          );
        }
      }

      if (parsed.type === "progress" && parsed.data?.fullOutput) {
        items.push(
          createTextItem({
            position: position++,
            rawText: parsed.data.fullOutput,
            contentRole: "artifact",
            titleFallback: "Tool output",
            metadata: {
              extraction_method: "claude-code-progress",
            },
          }),
        );
      }
    } catch {
      return fallbackConversationExtraction(rawText);
    }
  }

  return items.length > 0 ? items : fallbackConversationExtraction(rawText);
}

function extractStructuredJson(rawText: string): ExtractedItem[] | null {
  const normalized = normalizeText(rawText);

  if (!normalized.startsWith("{") && !normalized.startsWith("[")) {
    return null;
  }

  try {
    const parsed = JSON.parse(normalized) as
      | {
          mapping?: Record<
            string,
            {
              message?: {
                author?: { role?: string };
                content?: { parts?: string[] };
              };
            }
          >;
        }
      | Array<{ role?: string; content?: string }>;

    if (Array.isArray(parsed)) {
      return parsed
        .filter((entry) => entry.role && entry.content)
        .map((entry, index) =>
          createTextItem({
            position: index,
            rawText: entry.content ?? "",
            contentRole:
              entry.role === "user"
                ? "prompt"
                : entry.role === "assistant"
                  ? "response"
                  : "unknown",
            titleFallback: entry.role === "user" ? "Prompt" : "Response",
          }),
        );
    }

    if (parsed.mapping) {
      const items = Object.values(parsed.mapping)
        .map((entry) => {
          const role = entry.message?.author?.role;
          const content = entry.message?.content?.parts?.join("\n\n") ?? "";
          return { role, content };
        })
        .filter((entry) => entry.content.trim().length > 0)
        .map((entry, index) =>
          createTextItem({
            position: index,
            rawText: entry.content,
            contentRole:
              entry.role === "user"
                ? "prompt"
                : entry.role === "assistant"
                  ? "response"
                  : "unknown",
            titleFallback: entry.role === "user" ? "Prompt" : "Response",
          }),
        );

      return items;
    }
  } catch {
    return null;
  }

  return null;
}

function extractJsonLines(rawText: string): ExtractedItem[] | null {
  const normalized = normalizeText(rawText);
  const lines = normalized.split("\n").filter(Boolean);
  if (lines.length === 0 || !lines.every((line) => line.startsWith("{"))) {
    return null;
  }

  try {
    const parsed = lines.map((line) => JSON.parse(line) as Record<string, unknown>);
    if (parsed.some((entry) => typeof entry.type === "string")) {
      if (parsed.some((entry) => entry.type === "assistant" || entry.type === "user")) {
        return extractClaudeCodeJsonl(rawText);
      }
      return parsed.flatMap((entry, index) => {
        const text =
          typeof entry.text === "string"
            ? entry.text
            : typeof entry.output === "string"
              ? entry.output
              : "";
        if (!text) {
          return [];
        }
        return [
          createTextItem({
            position: index,
            rawText: text,
            contentRole: "artifact",
            titleFallback: "Imported JSONL item",
          }),
        ];
      });
    }
  } catch {
    return null;
  }

  return null;
}

async function buildArtifactBatchItems(
  files: UploadedFileReference[],
  audioLinks: string[],
): Promise<ExtractedItem[]> {
  const items: ExtractedItem[] = [];
  let position = 0;

  for (const file of files) {
    if (file.mimeType.startsWith("image/")) {
      items.push({
        position: position++,
        artifactType: "image",
        contentRole: "artifact",
        rawText: null,
        parsedMarkdown: null,
        title: file.originalName,
        metadata: {
          preserved_file_path: file.preservedPath,
          original_filename: file.originalName,
          file_size_bytes: file.sizeBytes,
          source_surface: "artifact-batch",
        },
        tags: [],
        defaultInclude: true,
      });
      continue;
    }

    const textContent =
      file.textContent ??
      (await readFile(file.preservedPath, "utf8").catch(() => ""));
    items.push({
      position: position++,
      artifactType: "text",
      contentRole: "artifact",
      rawText: textContent,
      parsedMarkdown: toMarkdown(textContent),
      title: createTitle(textContent, file.originalName),
      metadata: {
        preserved_file_path: file.preservedPath,
        original_filename: file.originalName,
        file_size_bytes: file.sizeBytes,
        source_surface: "artifact-batch",
      },
      tags: [],
      defaultInclude: true,
    });
  }

  for (const link of audioLinks.filter(Boolean)) {
    items.push({
      position: position++,
      artifactType: "audio_link",
      contentRole: "artifact",
      rawText: null,
      parsedMarkdown: null,
      title: createTitle(link, "Audio link"),
      metadata: {
        source_surface: "artifact-batch",
        original_url: link,
      },
      tags: [],
      defaultInclude: true,
    });
  }

  return items;
}

export async function extractItems(params: {
  kind: IngestionKind;
  rawText?: string;
  files?: UploadedFileReference[];
  audioLinks?: string[];
  sourceProviderHint?: SourceProvider | "auto";
  sourceSurfaceHint?: string;
}): Promise<ExtractionResult> {
  const rawText = params.rawText ? normalizeText(params.rawText) : "";
  const files = params.files ?? [];
  const audioLinks = params.audioLinks ?? [];

  if (params.kind === "artifact_batch") {
    return {
      sourceProvider: "unknown",
      sourceSurface: "artifact-batch",
      warnings:
        files.length + audioLinks.length > 10
          ? ["Artifact batch is capped at 10 items; extra entries were ignored."]
          : [],
      items: await buildArtifactBatchItems(
        files.slice(0, Math.max(0, 10 - audioLinks.length)),
        audioLinks.slice(0, 10),
      ),
    };
  }

  if (params.kind === "prompt_only") {
    return {
      sourceProvider: params.sourceProviderHint === "auto" || !params.sourceProviderHint
        ? "unknown"
        : params.sourceProviderHint,
      sourceSurface: "prompt-only",
      warnings: [],
      items: [
        createTextItem({
          position: 0,
          rawText,
          contentRole: "prompt",
          titleFallback: "Prompt draft",
          metadata: {
            extraction_method: "prompt-only",
          },
        }),
      ],
    };
  }

  const structured =
    extractStructuredJson(rawText) ?? extractJsonLines(rawText);
  const provider = detectProvider(rawText, params.sourceProviderHint);
  const surface = inferSurface(
    params.kind,
    provider,
    rawText,
    params.sourceSurfaceHint,
  );

  let items: ExtractedItem[];
  if (structured && structured.length > 0) {
    items = structured;
  } else if (provider === "openai") {
    items = extractOpenAIChat(rawText);
  } else if (provider === "google") {
    items = extractGeminiText(rawText);
  } else if (provider === "anthropic" && rawText.startsWith("{")) {
    items = extractClaudeCodeJsonl(rawText);
  } else {
    items = fallbackConversationExtraction(rawText);
  }

  const warnings: string[] = [];
  if (provider === "unknown") {
    warnings.push(
      "Provider detection fell back to unknown; review the extracted items carefully.",
    );
  }
  if (items.length <= 1) {
    warnings.push(
      "Extraction produced a single item. This usually means the source lacked reliable turn boundaries.",
    );
  }

  return {
    sourceProvider: provider,
    sourceSurface: surface,
    warnings,
    items: items.map((item) => ({
      ...item,
      metadata: {
        source_provider: PROVIDER_LABELS[provider],
        source_surface: surface,
        extraction_method: structured ? "structured" : "heuristic",
        ...item.metadata,
      },
    })),
  };
}
