"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { NodeBundle } from "@/lib/ingestions/types";

export function NodeDetailView({ nodeId }: { nodeId: string }) {
  const [bundle, setBundle] = useState<NodeBundle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/nodes/${nodeId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Node not found");
        return res.json();
      })
      .then((data) => setBundle(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [nodeId]);

  const toggleVisibility = async () => {
    if (!bundle) return;
    setIsUpdating(true);
    const newVisibility = bundle.node.visibility === "private" ? "public" : "private";

    try {
      const res = await fetch(`/api/nodes/${nodeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibility: newVisibility }),
      });
      if (!res.ok) throw new Error("Update failed");
      const { node } = await res.json();
      setBundle({ ...bundle, node });
    } catch (err) {
      alert("Failed to update visibility");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this Node? This will not delete the artifacts inside.")) return;
    
    try {
      const res = await fetch(`/api/nodes/${nodeId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      router.push("/vault");
      router.refresh();
    } catch (err) {
      alert("Failed to delete node");
    }
  };

  if (loading) return <div className="page"><div className="empty-state">Loading node...</div></div>;
  if (error || !bundle) return <div className="page"><div className="empty-state">{error || "Node not found"}</div></div>;

  const { node, artifacts } = bundle;

  return (
    <div className="page page--readable">
      <header className="page-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "24px" }}>
          <div>
            <p className="page-header__eyebrow">
              Node / {node.visibility}
            </p>
            <h1 className="page-header__title">{node.title}</h1>
            {node.hook && <p className="page-header__copy" style={{ fontWeight: 500, color: "var(--fg-strong)" }}>{node.hook}</p>}
            {node.description && <p className="page-header__copy">{node.description}</p>}
          </div>
          <div className="button-row" style={{ flexShrink: 0 }}>
            <button 
              className={`status-badge status-badge--${node.visibility}`}
              onClick={toggleVisibility}
              disabled={isUpdating}
              title="Click to toggle visibility"
              style={{ cursor: "pointer", background: "none", outline: "none" }}
            >
              {isUpdating ? "..." : node.visibility}
            </button>
          </div>
        </div>
      </header>

      <div className="node-content" style={{ marginTop: "48px", display: "flex", flexDirection: "column", gap: "48px" }}>
        {artifacts.length === 0 ? (
          <div className="empty-state">No artifacts bundled in this node.</div>
        ) : (
          artifacts.map((artifact, index) => (
            <section key={artifact.id} className="node-artifact-render">
              <header style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
                <span className="status-badge" style={{ padding: "2px 8px", fontSize: "10px" }}>{index + 1}</span>
                <h2 style={{ margin: 0, fontSize: "20px", color: "var(--fg-strong)" }}>{artifact.title || "Untitled artifact"}</h2>
              </header>

              <div className="card" style={{ background: "rgba(10, 11, 13, 0.4)", padding: "32px" }}>
                {artifact.type === "text" ? (
                  <div className="prose">
                    {/* Basic markdown rendering - for MVP we'll just show the text */}
                    <div style={{ whiteSpace: "pre-wrap", fontFamily: artifact.metadata.content_role === "prompt" ? "var(--font-mono)" : "var(--font-ui)", fontSize: "15px", lineHeight: 1.7 }}>
                      {artifact.parsedMarkdown || artifact.rawContent}
                    </div>
                  </div>
                ) : artifact.type === "image" ? (
                  <div style={{ textAlign: "center" }}>
                    {/* In a real app, we'd get a signed URL or public URL for Supabase storage */}
                    <div className="empty-state">Image: {artifact.storagePath}</div>
                  </div>
                ) : (
                  <div className="info-banner">
                    Audio Link: <a href={artifact.audioUrl || "#"} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "underline" }}>{artifact.audioUrl}</a>
                  </div>
                )}
              </div>

              <div className="artifact-meta" style={{ marginTop: "12px", display: "flex", gap: "8px", opacity: 0.7 }}>
                 <span className="meta-chip">{artifact.type}</span>
                 {artifact.metadata.source_model ? (
                   <span className="meta-chip">{String(artifact.metadata.source_model)}</span>
                 ) : null}
              </div>
            </section>
          ))
        )}
      </div>

      <footer style={{ marginTop: "80px", paddingTop: "32px", borderTop: "1px solid var(--border-base)", display: "flex", justifyContent: "space-between" }}>
        <Link href="/vault" className="button">← Back to Vault</Link>
        <button className="button" style={{ color: "var(--state-error)", borderColor: "rgba(240, 125, 134, 0.3)" }} onClick={handleDelete}>
          Delete Node
        </button>
      </footer>
    </div>
  );
}
