# OpenAI Dump

ChatGPT exports and related raw source material.

## Provider Info

- **Provider**: OpenAI
- **Products**: ChatGPT (web, iOS, Android, macOS), API, Codex CLI

## Export Methods

| Method | Location | Format | Notes |
|--------|----------|--------|-------|
| Account Export | [chatgpt.com/#settings/DataControls](https://chatgpt.com/#settings/DataControls) | JSON | Full conversation history |
| Web Copy-Paste | chatgpt.com/c/* | Markdown + UI artifacts | Includes "Thought for Xs" thinking blocks |
| iOS Share | ChatGPT app | Text/Markdown | Limited metadata |
| Codex CLI | Terminal | Markdown | Session-based output |

## Ingestion Path

```
Raw Export (JSON or pasted text)
    ↓
Parser: openai-parser
    ↓
Extract: 
  - If JSON: mapping[], conversation[], message[]
  - If paste: Heuristic detection of model, timestamp, content blocks
    ↓
Provenance: model, gizmo_id (for GPTs), timestamp, conversation_id
    ↓
Output: Clean Markdown + metadata JSON
```

## Expected Provenance Signals

- `model`: e.g., "gpt-4o", "o1-preview", "o3-mini"
- `gizmo_id`: For custom GPTs (starts with "g-")
- `timestamp`: ISO 8601 or relative ("2 hours ago")
- `conversation_id`: UUID format in URLs
- `thinking_blocks`: Content inside "Thought for Xs" sections (o1/o3 models)
- `tool_calls`: Code interpreter, browsing, DALL-E outputs

## Known Parsing Challenges

1. **Thinking blocks**: "Thought for 2m 49s" sections need special handling
2. **Tool outputs**: Code interpreter runs, DALL-E images, browser results
3. **Model attribution**: Sometimes buried in UI, not in content
4. **Memory/context**: ChatGPT's memory feature not always visible in export

## Samples

| File | Source | Method | Description |
|------|--------|--------|-------------|
| *(placeholder)* | TBD | TBD | Awaiting sample addition |

## Root-Level Files

Files in `dump/` root that are OpenAI-related:

- `GPT-firstpass.md` — Initial research sprint output (copy-paste)
- `GPT-original-seed.txt` — Original seed material

## Adding New Samples

1. Place raw export file in this directory
2. Create a `MANIFEST-{sample}.md` sidecar with:
   - Export date
   - Export method (account export vs copy-paste)
   - Model information (if known)
   - Any special features used (GPTs, tools, memory)
3. Update the Samples table above

## See Also

- [INGESTION_CORPUS.md](/INGESTION_CORPUS.md) — Overall corpus documentation
- [SCHEMA.md](/SCHEMA.md) — Data model for parsed artifacts
