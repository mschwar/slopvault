"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ArtifactRecord } from "@/lib/ingestions/types";

async function getIngestionsSnapshot(): Promise<{ artifacts: ArtifactRecord[] }> {
  const res = await fetch("/api/ingestions");
  if (!res.ok) {
    throw new Error("Failed to load vault contents.");
  }
  return res.json();
}

export function VaultClient() {
  const [items, setItems] = useState<ArtifactRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getIngestionsSnapshot()
      .then((snapshot) => {
        if (!active) {
          return;
        }
        setItems(snapshot.artifacts);
        setError(null);
      })
      .catch((caughtError) => {
        if (!active) {
          return;
        }
        setError(caughtError instanceof Error ? caughtError.message : "Vault load failed.");
      });

    return () => {
      active = false;
    };
  }, []);

  const emptyLabel = error
    ? error
    : "Nothing has been saved yet.";

  return (
    <div className="page">
      <header className="page-header">
        <p className="page-header__eyebrow">Vault</p>
        <h1 className="page-header__title">Committed artifacts live here.</h1>
        <p className="page-header__copy">
          This vault reads from the same local ingestion store used by `/api/ingestions`.
          Use <Link href="/dump">Dump</Link> to ingest and commit more artifacts.
        </p>
      </header>

      {items.length === 0 ? (
        <div className="empty-state">
          {emptyLabel} <Link href="/dump">Open The Dumpster</Link> and save something.
        </div>
      ) : (
        <div className="vault-list">
          {items.map((item) => (
            <article className="vault-item" key={item.id}>
              <div className="preview-card__header">
                <div>
                  <h2 className="preview-card__title">{item.title ?? "Untitled artifact"}</h2>
                  <p className="preview-card__summary">
                    {item.type === "text"
                      ? (item.parsedMarkdown ?? item.rawContent ?? "").slice(0, 160) ||
                        "Text artifact"
                      : item.type === "image"
                        ? "Image artifact"
                        : "Audio link"}
                  </p>
                </div>
                <span className="status-badge status-badge--private">private</span>
              </div>

              <div className="vault-item__meta">
                <span className="meta-chip">{item.type}</span>
                <span className="meta-chip">
                  {String(item.metadata.content_role ?? "artifact")}
                </span>
                <span className="vault-item__timestamp">
                  updated {new Date(item.updatedAt).toLocaleString()}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
