"use client";

import Link from "next/link";
import { startTransition, useMemo, useState } from "react";
import {
  browserFilesToDescriptors,
  buildIngestPreview
} from "@/lib/ingest";
import {
  commitIngestion,
  createIngestionDraft,
  analyzeIngestion,
  uploadIngestionSource,
} from "@/lib/ingestions/client-api";
import type {
  IngestPreviewResponse,
  IngestSaveResponse
} from "@/lib/ingest-contract";
import { MAX_BATCH_ARTIFACTS } from "@/lib/ingest-contract";
import { PreviewList } from "@/components/dump/PreviewList";
import { ProviderGuidePanel } from "@/components/dump/ProviderGuidePanel";
import type { IngestionKind } from "@/lib/ingestions/types";

export function DumpWorkspace() {
  const [textInput, setTextInput] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [preview, setPreview] = useState<IngestPreviewResponse | null>(null);
  const [saveReceipt, setSaveReceipt] = useState<IngestSaveResponse | null>(null);
  const [isClassifying, setIsClassifying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileNames = useMemo(() => files.map((file) => file.name), [files]);

  function attachFiles(nextFiles: File[]) {
    setError(null);
    setFiles(nextFiles.slice(0, MAX_BATCH_ARTIFACTS));

    if (nextFiles.length > MAX_BATCH_ARTIFACTS) {
      setError(`Only the first ${MAX_BATCH_ARTIFACTS} files are kept in one batch.`);
    }
  }

  async function handleClassify() {
    if (!textInput.trim() && files.length === 0) {
      setError("Paste text, drop files, or open an export guide before previewing.");
      return;
    }

    setError(null);
    setSaveReceipt(null);
    setIsClassifying(true);

    try {
      const descriptors = await browserFilesToDescriptors(files);
      const nextPreview = buildIngestPreview({
        textInput,
        files: descriptors
      });

      startTransition(() => {
        setPreview(nextPreview);
      });
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Preview failed. Try again with a smaller batch."
      );
    } finally {
      setIsClassifying(false);
    }
  }

  function kindForTextPreview(): IngestionKind {
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

  function extractAudioLinks(): string[] {
    const item = preview?.items[0];
    if (!item || item.classification.mode !== "audio_link") {
      return [];
    }

    const trimmed = textInput.trim();
    return trimmed ? [trimmed] : [];
  }

  async function commitTextIngestion(rawText: string) {
    const kind = kindForTextPreview();
    const { ingestion } = await createIngestionDraft(kind);
    const analyzed = await analyzeIngestion(ingestion.id, { rawText });
    if (analyzed.items.length === 0) {
      throw new Error("No items were extracted from the pasted text.");
    }
    return commitIngestion(ingestion.id);
  }

  async function commitArtifactBatchIngestion(batchFiles: File[], audioLinks: string[]) {
    const { ingestion } = await createIngestionDraft("artifact_batch");
    if (batchFiles.length > 0) {
      await uploadIngestionSource(ingestion.id, batchFiles);
    }
    const analyzed = await analyzeIngestion(ingestion.id, { audioLinks });
    if (analyzed.items.length === 0) {
      throw new Error("No items were extracted from the uploaded batch.");
    }
    return commitIngestion(ingestion.id);
  }

  async function handleSave() {
    if (!preview || preview.items.length === 0) {
      setError("Preview something first, then save it.");
      return;
    }

    setError(null);
    setIsSaving(true);

    try {
      const trimmed = textInput.trim();
      const audioLinks = extractAudioLinks();

      const commits: Array<Awaited<ReturnType<typeof commitIngestion>>> = [];

      if (files.length > 0) {
        if (trimmed && audioLinks.length === 0) {
          // Preserve both the pasted text and the batch files by committing two ingestions.
          commits.push(await commitTextIngestion(trimmed));
        }

        commits.push(await commitArtifactBatchIngestion(files, audioLinks));
      } else if (audioLinks.length > 0) {
        commits.push(await commitArtifactBatchIngestion([], audioLinks));
      } else {
        commits.push(await commitTextIngestion(trimmed));
      }

      const artifacts = commits.flatMap((entry) => entry.artifacts);

      const receipt: IngestSaveResponse = {
        savedAt: new Date().toISOString(),
        savedCount: artifacts.length,
        receipts: artifacts.map((a) => ({
          savedId: a.id,
          title: a.title || "Untitled",
          artifactType: a.type,
          visibility: "private" as const,
        })),
      };

      startTransition(() => {
        setSaveReceipt(receipt);
        setIsSaving(false);
      });
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Save failed. Try again."
      );
      setIsSaving(false);
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <p className="page-header__eyebrow">The Dumpster</p>
        <h1 className="page-header__title">Bring whatever you have.</h1>
        <p className="page-header__copy">
          Paste a conversation. Upload a provider export JSON. Drop in images, text
          files, or a batch of artifacts. SlopVault will classify the input, show you
          what it thinks it is, and let you save the result without making you learn
          the ingestion model first.
        </p>
      </header>

      <div className="dump-layout">
        <section className="dump-stack">
          <div className="card">
            <h2 className="card__title">Unified ingestion input</h2>
            <p className="card__copy">
              One textarea. One drop zone. One preview flow. The system decides whether
              you brought a conversation, a provider export, a prompt, an artifact, or
              an audio link.
            </p>

            <textarea
              className="dump-input"
              name="textInput"
              onChange={(event) => setTextInput(event.target.value)}
              placeholder="Paste anything: ChatGPT transcript, Claude export JSON, Gemini activity JSON, a standalone prompt, an audio URL, or a text artifact."
              value={textInput}
            />

            <div
              className="dropzone"
              data-dragging={dragging}
              onDragEnter={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                setDragging(false);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                attachFiles(Array.from(event.dataTransfer.files));
              }}
              style={{ marginTop: "24px" }}
            >
              <p className="dropzone__copy">
                Drag and drop files here, or pick up to {MAX_BATCH_ARTIFACTS} files in
                one batch.
              </p>
              <p className="dropzone__meta">
                Supported in the scaffold: JSON, text, Markdown, and image files.
              </p>

              <div className="button-row" style={{ marginTop: "16px" }}>
                <label className="button" htmlFor="file-input">
                  Choose files
                </label>
                <input
                  hidden
                  id="file-input"
                  multiple
                  onChange={(event) =>
                    attachFiles(Array.from(event.currentTarget.files ?? []))
                  }
                  type="file"
                />
              </div>
            </div>

            <div className="input-meta">
              {fileNames.length > 0 ? (
                fileNames.map((name) => (
                  <span className="input-chip" key={name}>
                    {name}
                  </span>
                ))
              ) : (
                <span className="input-chip">No files attached yet</span>
              )}
            </div>

            {error ? (
              <div className="info-banner" style={{ marginTop: "16px" }}>
                {error}
              </div>
            ) : null}

            <div className="button-row" style={{ marginTop: "24px" }}>
              <button
                className="button button--primary"
                disabled={isClassifying}
                onClick={handleClassify}
                type="button"
              >
                {isClassifying ? "Classifying..." : "Preview import"}
              </button>
              <button
                className="button"
                disabled={!preview || preview.items.length === 0 || isSaving}
                onClick={handleSave}
                type="button"
              >
                {isSaving ? "Saving..." : "Save to vault"}
              </button>
            </div>

            {saveReceipt ? (
              <div className="save-banner" style={{ marginTop: "24px" }}>
                Saved {saveReceipt.savedCount} item
                {saveReceipt.savedCount === 1 ? "" : "s"} to the vault.
                {" "}
                <Link href="/vault">Open the vault</Link>
              </div>
            ) : null}
          </div>

          <div className="card">
            <h2 className="card__title">Preview</h2>
            <p className="card__copy">
              Classification should explain what SlopVault thinks you gave it before
              anything is saved. Weak confidence is surfaced instead of hidden.
            </p>

            <div style={{ marginTop: "24px" }}>
              <PreviewList preview={preview} />
            </div>
          </div>
        </section>

        <aside className="dump-stack">
          <ProviderGuidePanel />

          <section className="card">
            <h2 className="card__title">What this scaffold saves</h2>
            <p className="card__copy">
              The current `/dump` implementation commits ingestions through the local
              API ingestion pipeline (`/api/ingestions`) so the end-to-end behavior can
              be tested before durable persistence is wired up.
            </p>
            <div className="preview-meta">
              <span className="meta-chip">local ingestion API</span>
              <span className="meta-chip">typed ingest contract</span>
              <span className="meta-chip">classification first</span>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
