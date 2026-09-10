import { PROVIDER_EXPORT_GUIDES } from "@/lib/provider-guides";

export function ProviderGuidePanel() {
  return (
    <section className="card" aria-labelledby="provider-guides-title">
      <h2 className="card__title" id="provider-guides-title">
        Export Guides
      </h2>
      <p className="card__copy">
        If the value is high enough, users will tolerate awkward export steps. Give
        them the exact path, then let SlopVault reward the effort.
      </p>

      <div className="guide-list" style={{ marginTop: "24px" }}>
        {PROVIDER_EXPORT_GUIDES.map((guide) => (
          <details className="guide-card" key={guide.provider}>
            <summary>
              <div>
                <h3 className="guide-card__title">{guide.label}</h3>
                <div className="guide-card__status">{guide.statusLabel}</div>
              </div>
              <span className="status-badge status-badge--inferred">Guide</span>
            </summary>

            <div className="guide-card__body">
              <p className="guide-card__upload-target">
                <strong>Upload target:</strong> {guide.uploadTarget}
              </p>

              <ol className="guide-card__list">
                {guide.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>

              <ul className="guide-card__notes">
                {guide.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>

              {guide.sourceUrl ? (
                <a
                  className="guide-card__source"
                  href={guide.sourceUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  Open source documentation
                </a>
              ) : null}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

