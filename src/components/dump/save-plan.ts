"use client";

import type { IngestPreviewResponse } from "@/lib/ingest-contract";
import type { IngestionKind } from "@/lib/ingestions/types";

export type DumpSaveAction =
  | {
      type: "text";
      kind: IngestionKind;
      rawText: string;
    }
  | {
      type: "artifact_batch";
      includeFiles: boolean;
      audioLinks: string[];
    };

export function kindForTextPreview(
  preview: IngestPreviewResponse | null,
): IngestionKind {
  const item = preview?.items[0];
  const mode = item?.classification.mode;

  if (mode === "standalone_prompt") {
    return "prompt_only";
  }

  if (mode === "provider_export_json") {
    return "source_json_upload";
  }

  return "conversation_paste";
}

export function extractAudioLinksFromPreview(
  textInput: string,
  preview: IngestPreviewResponse | null,
): string[] {
  const item = preview?.items[0];
  if (!item || item.classification.mode !== "audio_link") {
    return [];
  }

  const trimmed = textInput.trim();
  return trimmed ? [trimmed] : [];
}

export function buildDumpSavePlan(input: {
  textInput: string;
  filesCount: number;
  preview: IngestPreviewResponse | null;
}): DumpSaveAction[] {
  const trimmed = input.textInput.trim();
  const audioLinks = extractAudioLinksFromPreview(input.textInput, input.preview);

  const actions: DumpSaveAction[] = [];

  if (input.filesCount > 0) {
    // INTENTIONAL TWO-INGESTION MODEL:
    // The service layer requires draft kinds for text vs. files. When both exist,
    // we commit separate ingestions rather than forcing a hybrid kind.
    if (trimmed && audioLinks.length === 0) {
      actions.push({
        type: "text",
        kind: kindForTextPreview(input.preview),
        rawText: trimmed,
      });
    }

    // Audio links (when present) are attached to the artifact_batch ingestion so
    // they are not dropped when files are present.
    actions.push({
      type: "artifact_batch",
      includeFiles: true,
      audioLinks,
    });

    return actions;
  }

  if (audioLinks.length > 0) {
    actions.push({
      type: "artifact_batch",
      includeFiles: false,
      audioLinks,
    });
    return actions;
  }

  actions.push({
    type: "text",
    kind: kindForTextPreview(input.preview),
    rawText: trimmed,
  });

  return actions;
}

