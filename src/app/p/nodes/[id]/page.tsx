import { getPublicNodeBundle } from "@/lib/nodes/public-service";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ForkButton } from "@/components/nodes/ForkButton";
import { LineageView, LineageMini } from "@/components/lineage/LineageView";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function PublicNodePage({ params }: PageProps) {
  const { id } = await params;

  try {
    const { node, artifacts, lineage, authorPseudonym } = await getPublicNodeBundle(id);

    return (
      <div className="page page--readable">
        <header className="page-header">
          <p className="page-header__eyebrow">Public Node</p>
          <h1 className="page-header__title">{node.title}</h1>
          {node.hook && (
            <p className="page-header__copy" style={{ fontWeight: 500, color: "var(--fg-strong)" }}>
              {node.hook}
            </p>
          )}
          {node.description && <p className="page-header__copy">{node.description}</p>}
          
          {/* Meta row */}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-500">
            <span>
              by{" "}
              <Link href={`/u/${authorPseudonym}`} className="text-gray-300 hover:text-white hover:underline">
                {authorPseudonym}
              </Link>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-orange-500">
              <span>▲</span>
              {node.upvotes}
            </span>
            <LineageMini 
              forkCount={node.forkCount} 
              parentNodeId={node.parentNodeId} 
              nodeId={node.id}
            />
          </div>
          
          {/* Actions */}
          <div className="mt-6 flex items-center gap-3">
            <ForkButton nodeId={node.id} forkCount={node.forkCount} />
            <Link
              href="/feed"
              className="rounded border border-gray-700 bg-gray-900 px-4 py-2 text-sm font-medium text-gray-400 transition-colors hover:border-gray-600 hover:text-gray-200"
            >
              ← Back to Feed
            </Link>
          </div>
        </header>

        <div className="node-content" style={{ marginTop: "48px", display: "flex", flexDirection: "column", gap: "48px" }}>
          {artifacts.map((artifact, index) => (
            <section key={artifact.id} className="node-artifact-render">
              <header style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
                <span className="status-badge" style={{ padding: "2px 8px", fontSize: "10px" }}>{index + 1}</span>
                <h2 style={{ margin: 0, fontSize: "20px", color: "var(--fg-strong)" }}>
                  {artifact.title || "Untitled artifact"}
                </h2>
              </header>

              <div className="card" style={{ background: "rgba(10, 11, 13, 0.4)", padding: "32px" }}>
                {artifact.type === "text" ? (
                  <div style={{ whiteSpace: "pre-wrap", fontSize: "15px", lineHeight: 1.7 }}>
                    {artifact.parsedMarkdown || artifact.rawContent}
                  </div>
                ) : artifact.type === "image" ? (
                  <div className="empty-state">Image: {artifact.storagePath}</div>
                ) : (
                  <div className="info-banner">
                    Audio: <a href={artifact.audioUrl || "#"} style={{ textDecoration: "underline" }}>{artifact.audioUrl}</a>
                  </div>
                )}
              </div>
            </section>
          ))}
        </div>

        {/* Lineage Section */}
        {(lineage.parent || lineage.children.length > 0 || lineage.siblings.length > 0) && (
          <section id="lineage" className="mt-16 rounded border border-gray-800 bg-gray-950/50 p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-200">Lineage</h3>
            <LineageView lineage={lineage} currentNodeId={node.id} />
          </section>
        )}

        <footer style={{ marginTop: "80px", textAlign: "center", opacity: 0.6, fontSize: "14px" }}>
          <p>This is a public node shared from SlopVault.</p>
          <Link href="/" style={{ textDecoration: "underline" }}>Create your own vault.</Link>
        </footer>
      </div>
    );
  } catch (err) {
    notFound();
  }
}
