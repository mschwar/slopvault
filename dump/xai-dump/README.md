# xAI Dump

Grok and xAI exports and related raw source material.

## Provider Info

- **Provider**: xAI
- **Products**: Grok (x.com/i/grok, grok.com, iOS app)

## Export Methods

| Method | Location | Format | Notes |
|--------|----------|--------|-------|
| Account Export | [accounts.x.ai/data](https://accounts.x.ai/data) | JSON | Full conversation history |
| Web Copy-Paste | grok.com or x.com/i/grok | Markdown-ish | Real-time web access indicator |
| iOS Share | Grok app | Text/Markdown | Limited metadata |

## Ingestion Path

```
Raw Export (JSON or pasted text)
    ↓
Parser: xai-parser
    ↓
Extract: conversations[], messages[], search_results[]
    ↓
Provenance: model, timestamp, conversation_id, search_context
    ↓
Output: Clean Markdown + metadata JSON
```

## Expected Provenance Signals

- `model`: e.g., "grok-2", "grok-beta"
- `timestamp`: ISO 8601 format
- `conversation_id`: UUID format
- `search_context`: Whether Grok had real-time web access enabled
- `images`: Grok's image generation outputs

## Known Parsing Challenges

1. **Real-time search**: Grok's X integration produces search result summaries
2. **Image gen**: Native image generation needs metadata extraction
3. **Personality modes**: "Fun mode" vs regular mode affects output style
4. **X context**: Conversations may reference X posts/threads

## Samples

| File | Source | Method | Description |
|------|--------|--------|-------------|
| *(placeholder)* | TBD | TBD | Awaiting sample addition |

## Root-Level Files

Files in `dump/` root that are xAI-related:

- `Grok-firstpass.md` — Initial Grok output (copy-paste)

## Adding New Samples

1. Place raw export file in this directory
2. Create a `MANIFEST-{sample}.md` sidecar with:
   - Export date
   - Export method (account export vs copy-paste)
   - Model version (if known)
   - Notable features (search mode, image gen, personality)
3. Update the Samples table above

## See Also

- [INGESTION_CORPUS.md](/INGESTION_CORPUS.md) — Overall corpus documentation
- [SCHEMA.md](/SCHEMA.md) — Data model for parsed artifacts
