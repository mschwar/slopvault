import { getPublicNodeBundle } from "@/lib/nodes/public-service";
import Link from "next/link";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function PublicNodePage({ params }: PageProps) {
  const { id } = await params;

  try {
    const { node, artifacts } = await getPublicNodeBundle(id);

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
