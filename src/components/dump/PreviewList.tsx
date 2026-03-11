import type { IngestPreviewResponse } from "@/lib/ingest-contract";

interface PreviewListProps {
  preview: IngestPreviewResponse | null;
}

function confidenceTone(confidence: string) {
  if (confidence === "high") {
    return "status-badge status-badge--public";
  }

  if (confidence === "low") {
    return "status-badge status-badge--unresolved";
  }

  return "status-badge status-badge--inferred";
}

export function PreviewList({ preview }: PreviewListProps) {
  if (!preview || preview.items.length === 0) {
    return (
      <div className="empty-state">
        Preview will appear here after SlopVault classifies the text or files you
        bring into the hub.
      </div>
    );
  }

  return (
    <div className="preview-list">
      {preview.warnings.length > 0 ? (
        <div className="info-banner">
          {preview.warnings.map((warning) => (
            <div key={warning}>{warning}</div>
          ))}
        </div>
      ) : null}

      {preview.items.map((item) => (
        <article className="preview-card" key={item.id}>
          <div className="preview-card__header">
            <div>
              <h3 className="preview-card__title">{item.title}</h3>
              <p className="preview-card__summary">{item.summary}</p>
            </div>

            <span className={confidenceTone(item.classification.confidence)}>
              {item.classification.confidence} confidence
            </span>
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

          <div className="preview-meta">
            <span className="meta-chip">{item.classification.mode}</span>
            <span className="meta-chip">{item.artifactType}</span>
            {item.classification.provider ? (
              <span className="meta-chip">{item.classification.provider}</span>
            ) : null}
            <span className="meta-chip">{item.metadata.visibility}</span>
          </div>

          {item.warnings.length > 0 ? (
            <div className="warning-list">
              {item.warnings.map((warning) => (
                <span className="warning-chip" key={warning}>
                  {warning}
                </span>
              ))}
            </div>
          ) : null}
        </article>
      ))}
    </div>
  );
}

