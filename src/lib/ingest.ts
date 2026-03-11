import {
  INGEST_PARSER_VERSION,
  MAX_BATCH_ARTIFACTS,
  type IngestClassification,
  type IngestFileDescriptor,
  type IngestPreviewItem,
  type IngestPreviewRequest,
  type IngestPreviewResponse,
  type IngestProvider
} from "@/lib/ingest-contract";

const AUDIO_HOSTS = ["suno.com", "udio.com", "soundcloud.com"];
const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".gif"];
const TEXT_EXTENSIONS = [".txt", ".md", ".markdown", ".json"];

function createId(prefix: string) {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return `${prefix}-${random}`;
}

function clip(value: string, length = 240) {
  const normalized = value.trim().replace(/\s+/g, " ");

  if (normalized.length <= length) {
    return normalized;
  }

  return `${normalized.slice(0, length - 1).trim()}...`;
}

function toTitleCase(value: string) {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function fileExtension(name: string) {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot).toLowerCase() : "";
}

function looksLikeAudioUrl(text: string) {
  try {
    const url = new URL(text.trim());
    return AUDIO_HOSTS.some(
      (host) => url.hostname === host || url.hostname.endsWith(`.${host}`)
    );
  } catch {
    return false;
  }
}

function tryParseJson(text: string) {
  const trimmed = text.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
    return null;
  }

  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return null;
  }
}

function collectJsonSignals(
  value: unknown,
  keys: Set<string>,
  strings: Set<string>,
  counts: { arrays: number; objects: number; scalarStrings: number }
) {
  if (value === null || value === undefined) {
    return;
  }

  if (Array.isArray(value)) {
    counts.arrays += 1;
    for (const item of value.slice(0, 100)) {
      collectJsonSignals(item, keys, strings, counts);
    }
    return;
  }

  if (typeof value === "object") {
    counts.objects += 1;
    for (const [key, child] of Object.entries(value)) {
      keys.add(key);
      collectJsonSignals(child, keys, strings, counts);
    }
    return;
  }

  if (typeof value === "string") {
    counts.scalarStrings += 1;
    if (strings.size < 50) {
      strings.add(value);
    }
  }
}

function detectProviderFromJson(value: unknown): {
  provider: IngestProvider;
  reason: string;
  signals: string[];
  itemEstimate?: number;
} {
  const keys = new Set<string>();
  const strings = new Set<string>();
  const counts = { arrays: 0, objects: 0, scalarStrings: 0 };

  collectJsonSignals(value, keys, strings, counts);

  const keyList = [...keys];
  const stringBlob = [...strings].join(" ").toLowerCase();
  const has = (...expected: string[]) =>
    expected.every((entry) => keyList.includes(entry));

  const topArrayLength = Array.isArray(value) ? value.length : undefined;

  if (
    has("mapping", "title") ||
    keyList.includes("conversation_id") ||
    stringBlob.includes("chatgpt") ||
    stringBlob.includes("gpt-")
  ) {
    return {
      provider: "chatgpt",
      reason: "JSON shape matches a ChatGPT history export.",
      signals: ["mapping/title conversation keys", "ChatGPT/GPT markers"],
      itemEstimate: topArrayLength
    };
  }

  if (
    keyList.includes("chat_messages") ||
    stringBlob.includes("claude") ||
    stringBlob.includes("anthropic")
  ) {
    return {
      provider: "claude",
      reason: "JSON contains Claude or Anthropic conversation markers.",
      signals: ["chat_messages or Claude markers"],
      itemEstimate: topArrayLength
    };
  }

  if (
    stringBlob.includes("gemini") ||
    stringBlob.includes("gemini apps") ||
    keyList.includes("products") ||
    keyList.includes("activityControls")
  ) {
    return {
      provider: "gemini",
      reason: "JSON looks like Gemini Apps activity or Takeout data.",
      signals: ["Gemini strings", "activity-style keys"],
      itemEstimate: topArrayLength
    };
  }

  if (stringBlob.includes("grok") || stringBlob.includes("xai")) {
    return {
      provider: "grok",
      reason: "JSON contains Grok or xAI markers.",
      signals: ["Grok/xAI strings"],
      itemEstimate: topArrayLength
    };
  }

  return {
    provider: "generic",
    reason: "Valid JSON detected, but provider-specific markers are weak.",
    signals: ["valid JSON structure"],
    itemEstimate: topArrayLength
  };
}

function extractRoleBlocks(text: string) {
  const userPattern =
    /(?:^|\n)(?:User|You|Prompt)\s*:?\s*([\s\S]*?)(?=\n(?:Assistant|ChatGPT|Claude|Gemini|Grok)\s*:|\n?$)/i;
  const assistantPattern =
    /(?:^|\n)(?:Assistant|ChatGPT|Claude|Gemini|Grok)\s*:?\s*([\s\S]*)$/i;

  const promptMatch = text.match(userPattern);
  const outputMatch = text.match(assistantPattern);

  return {
    prompt: promptMatch?.[1]?.trim(),
    output: outputMatch?.[1]?.trim()
  };
}

function guessConversationProvider(text: string): IngestProvider | undefined {
  const normalized = text.toLowerCase();

  if (
    normalized.includes("thought for") ||
    normalized.includes("chatgpt") ||
    normalized.includes("o3") ||
    normalized.includes("gpt-")
  ) {
    return "chatgpt";
  }

  if (normalized.includes("claude")) {
    return "claude";
  }

  if (
    normalized.includes("gemini") ||
    normalized.includes("expand to view model thoughts")
  ) {
    return "gemini";
  }

  if (normalized.includes("grok")) {
    return "grok";
  }

  return undefined;
}

function looksLikeConversationPaste(text: string) {
  const normalized = text.toLowerCase();

  return [
    /thought for \d+/i,
    /\b(user|assistant|prompt)\s*:/i,
    /\b(chatgpt|claude|gemini|grok)\s*:/i,
    /expand to view model thoughts/i,
    /copy code/i
  ].some((pattern) => pattern.test(normalized));
}

function looksLikePrompt(text: string) {
  const lines = text
    .trim()
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0 || text.length > 1800) {
    return false;
  }

  if (looksLikeConversationPaste(text) || looksLikeAudioUrl(text)) {
    return false;
  }

  const imperativeHints = [
    "write",
    "generate",
    "make",
    "give me",
    "create",
    "act as",
    "help me"
  ];

  const normalized = text.toLowerCase();
  const hasPromptCue =
    normalized.includes("?") ||
    imperativeHints.some((hint) => normalized.includes(hint));

  return hasPromptCue && lines.length <= 14;
}

function buildClassification(
  input: Omit<IngestClassification, "signals"> & { signals?: IngestClassification["signals"] }
): IngestClassification {
  return {
    ...input,
    signals: input.signals ?? []
  };
}

function previewJsonInput(
  raw: string,
  parsed: unknown,
  fileName?: string
): IngestPreviewItem {
  const detected = detectProviderFromJson(parsed);
  const itemLabel =
    detected.itemEstimate && detected.itemEstimate > 1
      ? `${detected.itemEstimate} records detected`
      : "Single JSON source detected";

  return {
    id: createId("preview"),
    title: fileName
      ? `${fileName} import`
      : `${toTitleCase(detected.provider)} export import`,
    artifactType: "text",
    presentation: "artifact_only",
    summary: `${itemLabel}. SlopVault will treat this as a source-history import and preserve it for higher-fidelity lineage recovery.`,
    contentPreview: clip(raw, 320),
    metadata: {
      sourceSurface: fileName ? "upload" : "paste",
      fileName,
      rawLength: raw.length,
      parserVersion: INGEST_PARSER_VERSION,
      visibility: "private"
    },
    warnings:
      detected.provider === "generic"
        ? ["Provider is uncertain. Review this import before saving."]
        : [],
    classification: buildClassification({
      mode: "provider_export_json",
      provider: detected.provider,
      confidence: detected.provider === "generic" ? "low" : "high",
      artifactType: "text",
      reasons: [detected.reason],
      signals: detected.signals.map((signal) => ({
        label: "JSON signal",
        evidence: signal
      }))
    })
  };
}

function previewConversationPaste(raw: string): IngestPreviewItem {
  const provider = guessConversationProvider(raw);
  const roleBlocks = extractRoleBlocks(raw);
  const contentPreview = roleBlocks.output ?? raw;

  return {
    id: createId("preview"),
    title: provider ? `${toTitleCase(provider)} conversation` : "Conversation paste",
    artifactType: "text",
    presentation: roleBlocks.prompt ? "prompt_and_output" : "artifact_only",
    summary: "Conversation paste detected. SlopVault will parse the thread, preserve source cues, and save it as a retrievable text artifact.",
    promptPreview: roleBlocks.prompt ? clip(roleBlocks.prompt, 220) : undefined,
    contentPreview: clip(contentPreview, 320),
    metadata: {
      sourceSurface: "paste",
      detectedPrompt: roleBlocks.prompt,
      rawLength: raw.length,
      parserVersion: INGEST_PARSER_VERSION,
      visibility: "private"
    },
    warnings: roleBlocks.prompt ? [] : ["Prompt boundary is fuzzy. Review before saving."],
    classification: buildClassification({
      mode: "conversation_paste",
      provider,
      confidence: provider ? "high" : "medium",
      artifactType: "text",
      reasons: ["Role markers or chat UI patterns match a copied conversation."],
      signals: provider
        ? [{ label: "Provider cue", evidence: toTitleCase(provider) }]
        : []
    })
  };
}

function previewStandalonePrompt(raw: string, fileName?: string): IngestPreviewItem {
  return {
    id: createId("preview"),
    title: fileName ? `${fileName} prompt` : "Standalone prompt",
    artifactType: "text",
    presentation: "prompt_only",
    summary: "Prompt-only input detected. Save it now, then connect it to outputs later when they exist.",
    promptPreview: clip(raw, 280),
    metadata: {
      sourceSurface: fileName ? "upload" : "paste",
      fileName,
      detectedPrompt: raw.trim(),
      rawLength: raw.length,
      parserVersion: INGEST_PARSER_VERSION,
      visibility: "private"
    },
    warnings: ["No model output detected yet."],
    classification: buildClassification({
      mode: "standalone_prompt",
      confidence: "medium",
      artifactType: "text",
      reasons: ["Text looks like a direct instruction without response markers."]
    })
  };
}

function previewTextArtifact(raw: string, fileName?: string): IngestPreviewItem {
  const firstLine =
    raw
      .trim()
      .split("\n")
      .map((line) => line.trim())
      .find(Boolean) ?? "Standalone artifact";

  return {
    id: createId("preview"),
    title: fileName ?? clip(firstLine, 48),
    artifactType: "text",
    presentation: "artifact_only",
    summary: "Standalone text artifact detected. SlopVault will save it as-is and attach provenance if it can infer any.",
    contentPreview: clip(raw, 320),
    metadata: {
      sourceSurface: fileName ? "upload" : "paste",
      fileName,
      rawLength: raw.length,
      parserVersion: INGEST_PARSER_VERSION,
      visibility: "private"
    },
    warnings: [],
    classification: buildClassification({
      mode: "standalone_artifact",
      confidence: "medium",
      artifactType: "text",
      reasons: ["Text does not look like a structured conversation or a prompt-only input."]
    })
  };
}

export function previewTextInput(
  raw: string,
  fileName?: string
): IngestPreviewItem | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  if (looksLikeAudioUrl(trimmed)) {
    return {
      id: createId("preview"),
      title: "Audio link",
      artifactType: "audio_link",
      presentation: "link_only",
      summary: "Audio link detected. SlopVault will store the URL as an audio-link artifact.",
      contentPreview: trimmed,
      metadata: {
        sourceSurface: fileName ? "upload" : "paste",
        fileName,
        rawLength: raw.length,
        parserVersion: INGEST_PARSER_VERSION,
        visibility: "private"
      },
      warnings: [],
      classification: buildClassification({
        mode: "audio_link",
        confidence: "high",
        artifactType: "audio_link",
        reasons: ["Recognized audio host in URL."]
      })
    };
  }

  const parsedJson = tryParseJson(trimmed);
  if (parsedJson !== null) {
    return previewJsonInput(trimmed, parsedJson, fileName);
  }

  if (looksLikeConversationPaste(trimmed)) {
    return previewConversationPaste(trimmed);
  }

  if (looksLikePrompt(trimmed)) {
    return previewStandalonePrompt(trimmed, fileName);
  }

  return previewTextArtifact(trimmed, fileName);
}

export function previewFileDescriptor(
  file: IngestFileDescriptor
): IngestPreviewItem | null {
  const extension = fileExtension(file.name);
  const mime = file.type.toLowerCase();

  if (mime.startsWith("image/") || IMAGE_EXTENSIONS.includes(extension)) {
    return {
      id: createId("preview"),
      title: file.name,
      artifactType: "image",
      presentation: "media_only",
      summary: "Image artifact detected. SlopVault will store the file and preserve upload-side provenance.",
      metadata: {
        sourceSurface: "upload",
        fileName: file.name,
        parserVersion: INGEST_PARSER_VERSION,
        visibility: "private"
      },
      warnings: [],
      classification: buildClassification({
        mode: "standalone_artifact",
        confidence: "high",
        artifactType: "image",
        reasons: ["Image file extension or MIME type detected."]
      })
    };
  }

  if (TEXT_EXTENSIONS.includes(extension) || mime.includes("json") || mime.startsWith("text/")) {
    return previewTextInput(file.textContent ?? "", file.name);
  }

  return {
    id: createId("preview"),
    title: file.name,
    artifactType: "text",
    presentation: "artifact_only",
    summary: "Unsupported file type for rich preview. SlopVault can still retain this as a raw artifact placeholder.",
    metadata: {
      sourceSurface: "upload",
      fileName: file.name,
      parserVersion: INGEST_PARSER_VERSION,
      visibility: "private"
    },
    warnings: ["Preview is limited for this file type in the current MVP scaffold."],
    classification: buildClassification({
      mode: "standalone_artifact",
      confidence: "low",
      artifactType: "text",
      reasons: ["File type is not yet deeply parsed by the scaffold."]
    })
  };
}

export function buildIngestPreview(
  request: IngestPreviewRequest
): IngestPreviewResponse {
  const items: IngestPreviewItem[] = [];
  const warnings: string[] = [];

  const textItem = previewTextInput(request.textInput);
  if (textItem) {
    items.push(textItem);
  }

  const fileItems = request.files.slice(0, MAX_BATCH_ARTIFACTS).map(previewFileDescriptor);
  for (const item of fileItems) {
    if (item) {
      items.push(item);
    }
  }

  if (request.files.length > MAX_BATCH_ARTIFACTS) {
    warnings.push(
      `Only the first ${MAX_BATCH_ARTIFACTS} uploaded items are previewed in one batch.`
    );
  }

  if (items.length === 0) {
    warnings.push("Nothing to preview yet. Paste text, drop files, or open an export guide.");
  }

  return {
    receivedAt: new Date().toISOString(),
    itemCount: items.length,
    items,
    warnings
  };
}

export async function browserFilesToDescriptors(files: File[]) {
  const limitedFiles = files.slice(0, MAX_BATCH_ARTIFACTS);

  return Promise.all(
    limitedFiles.map(async (file) => {
      const extension = fileExtension(file.name);
      const shouldReadText =
        file.type.startsWith("text/") ||
        file.type.includes("json") ||
        TEXT_EXTENSIONS.includes(extension);

      const textContent = shouldReadText ? await file.text() : undefined;

      return {
        name: file.name,
        type: file.type || "application/octet-stream",
        size: file.size,
        textContent
      } satisfies IngestFileDescriptor;
    })
  );
}

