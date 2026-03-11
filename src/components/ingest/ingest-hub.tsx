"use client";

import { useMemo, useState } from "react";
import type {
  ArtifactRecord,
  IngestionItemRecord,
  IngestionKind,
  IngestionRecord,
  SourceProvider,
} from "@/lib/ingestions/types";

type Snapshot = {
  ingestions: IngestionRecord[];
  artifacts: ArtifactRecord[];
};

type Bundle = {
  ingestion: IngestionRecord;
  items: IngestionItemRecord[];
};

const modeLabels: Record<IngestionKind, { title: string; description: string }> = {
  source_json_upload: {
    title: "Source JSON",
    description: "Upload one provider export or session log and preserve the raw source.",
  },
  conversation_paste: {
    title: "Conversation Paste",
    description: "Paste a full chat transcript and split it into prompt/response records.",
  },
  artifact_batch: {
    title: "Artifact Batch",
    description: "Upload up to 10 mixed artifacts plus audio links in one ingest.",
  },
  prompt_only: {
    title: "Prompt Only",
    description: "Save a standalone prompt as a first-class text record for later trace linking.",
  },
};

const providerOptions: Array<{ label: string; value: SourceProvider | "auto" }> = [
  { label: "Auto-detect", value: "auto" },
  { label: "OpenAI", value: "openai" },
  { label: "Google / Gemini", value: "google" },
  { label: "Anthropic", value: "anthropic" },
  { label: "xAI / Grok", value: "xai" },
];

async function readJson<T>(input: Promise<Response>): Promise<T> {
  const response = await input;
  const payload = (await response.json()) as T & { error?: string };
  if (!response.ok && "error" in payload && payload.error) {
    throw new Error(payload.error);
  }
  return payload;
}

export function IngestHub({ initialSnapshot }: { initialSnapshot: Snapshot }) {
  const [mode, setMode] = useState<IngestionKind>("conversation_paste");
  const [providerHint, setProviderHint] = useState<SourceProvider | "auto">("auto");
  const [conversationText, setConversationText] = useState("");
  const [promptText, setPromptText] = useState("");
  const [audioLinks, setAudioLinks] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [snapshot, setSnapshot] = useState<Snapshot>(initialSnapshot);
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string>("Ready.");
  const [error, setError] = useState<string | null>(null);

  const selectedMode = useMemo(() => modeLabels[mode], [mode]);

  async function refreshSnapshot() {
    const next = await readJson<Snapshot>(fetch("/api/ingestions"));
    setSnapshot(next);
  }

  async function runAnalyzeFlow() {
    setBusy(true);
    setError(null);
    setStatus("Creating draft ingestion...");

    try {
      const created = await readJson<{ ingestion: IngestionRecord }>(
        fetch("/api/ingestions/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: mode,
            sourceProviderHint: providerHint,
          }),
        }),
      );

      if (files.length > 0) {
        setStatus("Uploading preserved source files...");
        const formData = new FormData();
        for (const file of files.slice(0, 10)) {
          formData.append("files", file);
        }
        await readJson(
          fetch(`/api/ingestions/${created.ingestion.id}/upload`, {
            method: "POST",
            body: formData,
          }),
        );
      }

      setStatus("Analyzing ingestion into staged items...");
      const analyzed = await readJson<Bundle>(
        fetch(`/api/ingestions/${created.ingestion.id}/analyze`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rawText:
              mode === "conversation_paste"
                ? conversationText
                : mode === "prompt_only"
                  ? promptText
                  : undefined,
            audioLinks:
              mode === "artifact_batch"
                ? audioLinks
                    .split("\n")
                    .map((line) => line.trim())
                    .filter(Boolean)
                : [],
            sourceProviderHint: providerHint,
          }),
        }),
      );

      setBundle(analyzed);
      await refreshSnapshot();
      setStatus("Review the staged items, then commit the ingestion.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Analyze failed.");
      setStatus("Ingestion failed.");
    } finally {
      setBusy(false);
    }
  }

  async function updateItem(
    itemId: string,
    patch: Partial<Pick<IngestionItemRecord, "include" | "title" | "tags">>,
  ) {
    if (!bundle) {
      return;
    }

    try {
      const result = await readJson<{ item: IngestionItemRecord }>(
        fetch(`/api/ingestions/${bundle.ingestion.id}/items/${itemId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        }),
      );

      setBundle({
        ...bundle,
        items: bundle.items.map((item) =>
          item.id === itemId ? result.item : item,
        ),
      });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Update failed.");
    }
  }

  async function commitBundle() {
    if (!bundle) {
      return;
    }

    setBusy(true);
    setError(null);
    setStatus("Committing ingestion...");
    try {
      await readJson(
        fetch(`/api/ingestions/${bundle.ingestion.id}/commit`, {
          method: "POST",
        }),
      );
      await refreshSnapshot();
      setBundle(null);
      setStatus("Ingestion committed. The vault and provenance links are updated.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Commit failed.");
      setStatus("Commit failed.");
    } finally {
      setBusy(false);
    }
  }

  async function discardBundle() {
    if (!bundle) {
      return;
    }

    setBusy(true);
    setError(null);
    setStatus("Discarding draft...");
    try {
      await readJson(
        fetch(`/api/ingestions/${bundle.ingestion.id}/discard`, {
          method: "POST",
        }),
      );
      await refreshSnapshot();
      setBundle(null);
      setStatus("Draft discarded.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Discard failed.");
      setStatus("Discard failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <span className="eyebrow">SlopVault / Ingest V1</span>
        <h1>Preserve the raw source. Review the structure. Commit the trace.</h1>
        <p>
          This implementation keeps the product artifact-first while adding a hidden
          ingestion envelope, staged review, raw-source preservation, and lightweight
          provenance links.
        </p>
      </section>

      <div className="grid">
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Ingest Hub</h2>
              <p className="panel-subtitle">{selectedMode.description}</p>
            </div>
            <span className={`status${error ? " error" : ""}`}>{error ?? status}</span>
          </div>
          <div className="panel-body">
            <div className="mode-tabs">
              {(Object.keys(modeLabels) as IngestionKind[]).map((key) => (
                <button
                  key={key}
                  className={`mode-tab${mode === key ? " active" : ""}`}
                  onClick={() => setMode(key)}
                  type="button"
                >
                  <strong>{modeLabels[key].title}</strong>
                  <span>{modeLabels[key].description}</span>
                </button>
              ))}
            </div>

            <div className="form-grid">
              <div className="field">
                <label htmlFor="provider-hint">Provider hint</label>
                <select
                  id="provider-hint"
                  value={providerHint}
                  onChange={(event) =>
                    setProviderHint(event.target.value as SourceProvider | "auto")
                  }
                >
                  {providerOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {mode === "source_json_upload" ? (
                <div className="field">
                  <label htmlFor="source-file">Provider export / log file</label>
                  <input
                    id="source-file"
                    type="file"
                    accept=".json,.jsonl,.txt,.md"
                    onChange={(event) =>
                      setFiles(Array.from(event.target.files ?? []).slice(0, 1))
                    }
                  />
                  <p className="hint">
                    Upload one export/log file. The raw file is preserved before parsing.
                  </p>
                </div>
              ) : null}

              {mode === "conversation_paste" ? (
                <div className="field">
                  <label htmlFor="conversation-text">Full conversation paste</label>
                  <textarea
                    id="conversation-text"
                    value={conversationText}
                    onChange={(event) => setConversationText(event.target.value)}
                    placeholder="Paste the full copied conversation transcript here."
                  />
                </div>
              ) : null}

              {mode === "artifact_batch" ? (
                <>
                  <div className="field">
                    <label htmlFor="artifact-files">Mixed artifacts (up to 10 total)</label>
                    <input
                      id="artifact-files"
                      type="file"
                      multiple
                      accept=".txt,.md,.json,.jsonl,image/*"
                      onChange={(event) =>
                        setFiles(Array.from(event.target.files ?? []).slice(0, 10))
                      }
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="audio-links">Audio links</label>
                    <textarea
                      id="audio-links"
                      value={audioLinks}
                      onChange={(event) => setAudioLinks(event.target.value)}
                      placeholder="One audio URL per line."
                    />
                  </div>
                </>
              ) : null}

              {mode === "prompt_only" ? (
                <div className="field">
                  <label htmlFor="prompt-text">Standalone prompt</label>
                  <textarea
                    id="prompt-text"
                    value={promptText}
                    onChange={(event) => setPromptText(event.target.value)}
                    placeholder="Write the prompt you want to preserve as a first-class record."
                  />
                </div>
              ) : null}
            </div>

            <div className="actions">
              <button className="button primary" onClick={runAnalyzeFlow} disabled={busy}>
                {busy ? "Working..." : "Analyze Into Review"}
              </button>
              <button
                className="button"
                type="button"
                onClick={() => {
                  setConversationText("");
                  setPromptText("");
                  setAudioLinks("");
                  setFiles([]);
                  setBundle(null);
                  setError(null);
                  setStatus("Ready.");
                }}
              >
                Reset
              </button>
            </div>

            {bundle ? (
              <section className="review-grid">
                <div className="review-summary">
                  <div className="pill-row">
                    <span className="pill">{bundle.ingestion.kind}</span>
                    <span className="pill">{bundle.ingestion.sourceProvider}</span>
                    <span className="pill">{bundle.ingestion.sourceSurface}</span>
                    <span className="pill">{bundle.items.length} staged items</span>
                  </div>
                  {bundle.ingestion.warnings.length > 0 ? (
                    <div className="warning-list">
                      {bundle.ingestion.warnings.map((warning) => (
                        <span key={warning}>{warning}</span>
                      ))}
                    </div>
                  ) : null}
                  <p className="hint">
                    Review the staged items. Include or exclude them, edit titles and tags, then
                    commit the ingestion into the vault.
                  </p>
                </div>

                {bundle.items.map((item) => (
                  <article className="item-card" key={item.id}>
                    <div className="item-card-header">
                      <div className="pill-row">
                        <span className="pill">{item.artifactType}</span>
                        <span className="pill">{item.contentRole}</span>
                        <span className="pill">position {item.position}</span>
                      </div>
                      <label className="pill">
                        <input
                          type="checkbox"
                          checked={item.include}
                          onChange={(event) =>
                            updateItem(item.id, { include: event.target.checked })
                          }
                        />
                        &nbsp;include
                      </label>
                    </div>

                    <div className="field">
                      <label htmlFor={`title-${item.id}`}>Title</label>
                      <input
                        id={`title-${item.id}`}
                        value={item.title ?? ""}
                        onChange={(event) =>
                          setBundle((current) =>
                            current
                              ? {
                                  ...current,
                                  items: current.items.map((candidate) =>
                                    candidate.id === item.id
                                      ? { ...candidate, title: event.target.value }
                                      : candidate,
                                  ),
                                }
                              : current,
                          )
                        }
                        onBlur={(event) => updateItem(item.id, { title: event.target.value })}
                      />
                    </div>

                    <div className="field">
                      <label htmlFor={`tags-${item.id}`}>Tags</label>
                      <input
                        id={`tags-${item.id}`}
                        value={item.tags.join(", ")}
                        onBlur={(event) =>
                          updateItem(item.id, {
                            tags: event.target.value
                              .split(",")
                              .map((tag) => tag.trim())
                              .filter(Boolean),
                          })
                        }
                        placeholder="comma,separated,tags"
                      />
                    </div>

                    {item.rawText || item.parsedMarkdown ? (
                      <pre className="item-preview">
                        {item.parsedMarkdown ?? item.rawText ?? "(binary artifact)"}
                      </pre>
                    ) : (
                      <p className="hint">Binary artifact preserved from upload.</p>
                    )}
                  </article>
                ))}

                <div className="review-actions">
                  <button className="button primary" onClick={commitBundle} disabled={busy}>
                    Commit Ingestion
                  </button>
                  <button className="button danger" onClick={discardBundle} disabled={busy}>
                    Discard Draft
                  </button>
                </div>
              </section>
            ) : null}
          </div>
        </section>

        <aside className="stack">
          <section className="panel">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">Recent Ingestions</h2>
                <p className="panel-subtitle">
                  Hidden envelopes that preserve raw source and staging state.
                </p>
              </div>
            </div>
            <div className="panel-body list">
              {snapshot.ingestions.length === 0 ? (
                <p className="empty">No ingestions yet.</p>
              ) : (
                snapshot.ingestions.slice(0, 8).map((ingestion) => (
                  <article className="list-item" key={ingestion.id}>
                    <h3>{modeLabels[ingestion.kind].title}</h3>
                    <div className="pill-row">
                      <span className="pill">{ingestion.status}</span>
                      <span className="pill">{ingestion.sourceProvider}</span>
                      <span className="pill">{ingestion.sourceSurface}</span>
                    </div>
                    <span className="meta">{new Date(ingestion.updatedAt).toLocaleString()}</span>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">Vault Preview</h2>
                <p className="panel-subtitle">
                  Committed artifacts generated from the reviewed ingestions.
                </p>
              </div>
            </div>
            <div className="panel-body list">
              {snapshot.artifacts.length === 0 ? (
                <p className="empty">No committed artifacts yet.</p>
              ) : (
                snapshot.artifacts.slice(0, 8).map((artifact) => (
                  <article className="list-item" key={artifact.id}>
                    <h3>{artifact.title ?? "Untitled artifact"}</h3>
                    <div className="pill-row">
                      <span className="pill">{artifact.type}</span>
                      <span className="pill">
                        {String(artifact.metadata.content_role ?? "artifact")}
                      </span>
                      <span className="pill">
                        {String(artifact.metadata.source_provider ?? "unknown")}
                      </span>
                    </div>
                    <span className="meta">{new Date(artifact.createdAt).toLocaleString()}</span>
                  </article>
                ))
              )}
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
