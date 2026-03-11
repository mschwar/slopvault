"use client";

import Link from "next/link";
import { startTransition, useMemo, useState } from "react";
import { savePreviewItemsToDemoVault } from "@/lib/demo-vault";
import {
  browserFilesToDescriptors,
  buildIngestPreview
} from "@/lib/ingest";
import type {
  IngestPreviewResponse,
  IngestSaveResponse
} from "@/lib/ingest-contract";
import { MAX_BATCH_ARTIFACTS } from "@/lib/ingest-contract";
import { PreviewList } from "@/components/dump/PreviewList";
import { ProviderGuidePanel } from "@/components/dump/ProviderGuidePanel";

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

  function handleSave() {
    if (!preview || preview.items.length === 0) {
      setError("Preview something first, then save it.");
      return;
    }

    setError(null);
    setIsSaving(true);

    startTransition(() => {
      const receipt = savePreviewItemsToDemoVault(preview.items);
      setSaveReceipt(receipt);
      setIsSaving(false);
    });
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
                {isSaving ? "Saving..." : "Save to demo vault"}
              </button>
            </div>

            {saveReceipt ? (
              <div className="save-banner" style={{ marginTop: "24px" }}>
                Saved {saveReceipt.savedCount} item
                {saveReceipt.savedCount === 1 ? "" : "s"} to the demo vault.
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
              The current `/dump` implementation saves preview items into a local demo
              vault so the end-to-end behavior can be tested before the real artifact
              backend and parser/import pipeline are wired to Supabase.
            </p>
            <div className="preview-meta">
              <span className="meta-chip">local demo save</span>
              <span className="meta-chip">typed ingest contract</span>
              <span className="meta-chip">classification first</span>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

