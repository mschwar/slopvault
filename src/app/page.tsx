import Link from "next/link";

export default function HomePage() {
  return (
    <div className="page page--readable">
      <header className="page-header">
        <p className="page-header__eyebrow">Capture. Retrieve. Share.</p>
        <h1 className="page-header__title">
          SlopVault starts with one ingestion door.
        </h1>
        <p className="page-header__copy">
          The MVP does not ask users to understand seed imports, trace imports,
          standalone prompts, or artifact batches before they begin. It asks them to
          bring whatever they have to one place.
        </p>
      </header>

      <section className="card">
        <h2 className="card__title">What is working right now</h2>
        <p className="card__copy">
          `/dump` now has a live client-side ingest scaffold: unified paste and upload,
          heuristic input classification, provider export guides, preview generation,
          and a local demo save path into `/vault`.
        </p>
        <div className="button-row hero-actions">
          <Link className="button button--primary" href="/dump">
            Open The Dumpster
          </Link>
          <Link className="button" href="/vault">
            Open Vault
          </Link>
        </div>
      </section>
    </div>
  );
}

