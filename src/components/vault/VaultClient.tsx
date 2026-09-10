"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getIngestionsSnapshot } from "@/lib/ingestions/client-api";
import type { ArtifactRecord } from "@/lib/ingestions/types";

export function VaultClient() {
  const [items, setItems] = useState<ArtifactRecord[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let active = true;
    getIngestionsSnapshot()
      .then((snapshot) => {
        if (!active) return;
        setItems(snapshot.artifacts);
        setError(null);
      })
      .catch((caughtError) => {
        if (!active) return;
        setError(caughtError instanceof Error ? caughtError.message : "Vault load failed.");
      });

    return () => {
      active = false;
    };
  }, []);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCreateNode = () => {
    const ids = Array.from(selectedIds).join(",");
    router.push(`/nodes/new?ids=${ids}` as any);
  };

  const emptyLabel = error ? error : "Nothing has been saved yet.";

  return (
    <div className="page">
      <header className="page-header">
        <p className="page-header__eyebrow">Vault</p>
        <h1 className="page-header__title">Committed artifacts live here.</h1>
        <p className="page-header__copy">
          Select multiple artifacts to bundle them into a shareable <strong>Node</strong>.
          Use <Link href="/dump" style={{ textDecoration: "underline" }}>The Dumpster</Link> to ingest more.
        </p>
      </header>

      {items.length === 0 ? (
        <div className="empty-state">
          {emptyLabel} <Link href="/dump">Open The Dumpster</Link> and save something.
        </div>
      ) : (
        <div className="vault-list">
          {items.map((item) => {
            const isSelected = selectedIds.has(item.id);
            return (
              <article
                className="vault-item"
                key={item.id}
                onClick={() => toggleSelection(item.id)}
                data-selected={isSelected}
              >
                <div className="vault-item__checkbox" />
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
                  <span className={`status-badge status-badge--${item.visibility}`}>
                    {item.visibility}
                  </span>
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
            );
          })}
        </div>
      )}

      {selectedIds.size > 0 && (
        <div className="action-bar">
          <div className="action-bar__count">{selectedIds.size} selected</div>
          <button className="button button--primary" onClick={handleCreateNode}>
            Bundle into Node
          </button>
          <button className="button" onClick={() => setSelectedIds(new Set())}>
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
