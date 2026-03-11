"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  listDemoVaultArtifacts,
  type DemoVaultArtifact
} from "@/lib/demo-vault";

export function VaultClient() {
  const [items, setItems] = useState<DemoVaultArtifact[]>([]);

  useEffect(() => {
    setItems(listDemoVaultArtifacts());
  }, []);

  return (
    <div className="page">
      <header className="page-header">
        <p className="page-header__eyebrow">Demo Vault</p>
        <h1 className="page-header__title">Saved ingest previews live here for now.</h1>
        <p className="page-header__copy">
          This is a local-browser stand-in for the real Stash. It exists so `/dump`
          has a real preview-to-save loop while the backend is still empty.
        </p>
      </header>

      {items.length === 0 ? (
        <div className="empty-state">
          Nothing has been saved yet. <Link href="/dump">Open The Dumpster</Link> and
          save a preview first.
        </div>
      ) : (
        <div className="vault-list">
          {items.map((item) => (
            <article className="vault-item" key={item.savedId}>
              <div className="preview-card__header">
                <div>
                  <h2 className="preview-card__title">{item.title}</h2>
                  <p className="preview-card__summary">{item.summary}</p>
                </div>
                <span className="status-badge status-badge--private">private</span>
              </div>

              {item.promptPreview ? (
                <div className="preview-block">
                  <p className="preview-block__label">Prompt</p>
                  <p className="preview-block__value">{item.promptPreview}</p>
                </div>
              ) : null}

              {item.contentPreview ? (
                <div className="preview-block">
                  <p className="preview-block__label">Preview</p>
                  <p className="preview-block__value">{item.contentPreview}</p>
                </div>
              ) : null}

              <div className="vault-item__meta">
                <span className="meta-chip">{item.classification.mode}</span>
                <span className="meta-chip">{item.artifactType}</span>
                {item.classification.provider ? (
                  <span className="meta-chip">{item.classification.provider}</span>
                ) : null}
                <span className="vault-item__timestamp">
                  saved {new Date(item.savedAt).toLocaleString()}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

