# Anthropic Dump

Claude exports and related raw source material.

## Provider Info

- **Provider**: Anthropic
- **Products**: Claude (web, iOS, API), Claude Code (CLI)

## Export Methods

| Method | Location | Format | Notes |
|--------|----------|--------|-------|
| Account Export | [claude.ai/settings/data-privacy-controls](https://claude.ai/settings/data-privacy-controls) | JSON | Full conversation history, projects, memories |
| Web Copy-Paste | claude.ai/chat | Markdown-ish | Includes "Artifacts" and model attribution |
| Claude Code CLI | Terminal | Markdown | Local session files |

## Ingestion Path

```
Raw Export
    ↓
Parser: anthropic-parser (handles JSON export or web copy)
    ↓
Extract: conversations[], messages[], artifacts[]
    ↓
Provenance: model, timestamp, conversation_id, project_id
    ↓
Output: Clean Markdown + metadata JSON
```

## Expected Provenance Signals

- `model`: e.g., "claude-3-5-sonnet-20241022", "claude-3-opus-20240229"
- `timestamp`: ISO 8601 format
- `conversation_id`: UUID format
- `project_id`: UUID format (if in project)
- `artifacts`: Array of artifact metadata with type, title, content

## Samples

| File | Source | Method | Description |
|------|--------|--------|-------------|
| *(placeholder)* | TBD | TBD | Awaiting sample addition |

## Adding New Samples

1. Place raw export file in this directory
2. Create a `MANIFEST-{sample}.md` sidecar with:
   - Export date
   - Export method
   - Expected provenance signals
   - Any anomalies or parsing notes
3. Update the Samples table above

## See Also

- [INGESTION_CORPUS.md](/INGESTION_CORPUS.md) — Overall corpus documentation
- [SCHEMA.md](/SCHEMA.md) — Data model for parsed artifacts
