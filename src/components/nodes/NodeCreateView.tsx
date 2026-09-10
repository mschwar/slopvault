"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { ArtifactRecord, CreateNodeInput } from "@/lib/ingestions/types";

export function NodeCreateView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const artifactIds = searchParams.get("ids")?.split(",") || [];

  const [artifacts, setArtifacts] = useState<ArtifactRecord[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hook, setHook] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (artifactIds.length === 0) {
      router.push("/vault");
      return;
    }

    // Fetch details for selected artifacts
    // In a real app, we might fetch only these specific IDs.
    // For MVP, we can fetch all and filter or just use the IDs.
    // Let's assume we want to show titles.
    fetch("/api/ingestions")
      .then((res) => res.json())
      .then((data) => {
        const filtered = (data.artifacts as ArtifactRecord[]).filter((a) =>
          artifactIds.includes(a.id)
        );
        setArtifacts(filtered);
      })
      .catch(() => setError("Failed to load artifact details"));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const input: CreateNodeInput = {
      title,
      description: description || undefined,
      hook: hook || undefined,
      artifactIds,
    };

    try {
      const res = await fetch("/api/nodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create node");
      }

      const { node } = await res.json();
      router.push(`/nodes/${node.id}` as any);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create node");
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <header className="page-header">
        <p className="page-header__eyebrow">Packaging</p>
        <h1 className="page-header__title">Bundle into Node.</h1>
        <p className="page-header__copy">
          Give this collection a title and a hook. Nodes are shareable packages
          of your best artifacts.
        </p>
      </header>

      <div className="node-layout">
        <main>
          <form id="node-form" className="node-form" onSubmit={handleSubmit}>
            <div className="node-field">
              <label htmlFor="title">Title</label>
              <input
                id="title"
                type="text"
                className="node-input"
                placeholder="The Substrate Research Project"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="node-field">
              <label htmlFor="hook">The Hook (Short summary)</label>
              <input
                id="hook"
                type="text"
                className="node-input"
                placeholder="A deep dive into cross-model provenance."
                value={hook}
                onChange={(e) => setHook(e.target.value)}
              />
            </div>

            <div className="node-field">
              <label htmlFor="description">Detailed Description (Optional)</label>
              <textarea
                id="description"
                className="node-input node-input--textarea"
                placeholder="This project explores how different models interpret the same seed prompts..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {error && <div className="info-banner" style={{ color: "var(--state-error)" }}>{error}</div>}

            <div className="button-row" style={{ marginTop: "24px" }}>
              <button
                type="submit"
                className="button button--primary"
                disabled={loading || !title}
              >
                {loading ? "Creating..." : "Create Node"}
              </button>
              <button
                type="button"
                className="button"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        </main>

        <aside className="node-sidebar">
          <div className="node-field">
            <label>Bundled Artifacts ({artifacts.length})</label>
            <div className="node-artifacts-list">
              {artifacts.map((a) => (
                <div key={a.id} className="node-artifact-mini">
                  <div className="node-artifact-mini__icon">{a.type[0].toUpperCase()}</div>
                  <div className="node-artifact-mini__title">{a.title || "Untitled"}</div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
