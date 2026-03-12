# Manifest: gemini-raw-seed.md

## Sample Info

| Field | Value |
|-------|-------|
| **Filename** | `gemini-raw-seed.md` |
| **Location** | `dump/` (root) |
| **Provider** | Google (Gemini) |
| **Source Surface** | gemini.google.com (web) |
| **Export Method** | Copy-paste (Ctrl+A, Ctrl+V) |
| **Date Captured** | March 2026 |

## Description

This is the **canonical test case** for the SlopVault ingestion pipeline. It represents the founder's original 12-hour research sprint workflow — the origin story that led to this product.

The content is an anthropological research exploration into "Civilizational Substrate Technologies" inspired by the book *Chip War*. This represents exactly the kind of multi-model, multi-session research work that SlopVault is designed to capture.

## Provenance Expectations

### Detectable Signals
- **Provider**: Google (detected from content patterns)
- **Source Surface**: Gemini web (browser copy-paste)
- **Model**: Likely Gemini 1.5 Pro or Flash (inferred from date + context)
- **Timestamp**: Not explicitly present in copy-paste

### Missing Signals
- Exact timestamp
- Specific model version
- Conversation ID
- Session metadata
- File attachments (if any)

## Ingestion Kind

- **Primary**: `text/markdown` (raw paste)
- **Expected Parser**: `google-parser` → `gemini-web-variant`
- **Target Format**: Clean Markdown + JSON metadata sidecar

## Known Parsing Challenges

1. **Mixed content types**: Research notes, citations, framework outlines
2. **No explicit model attribution**: Must be inferred or manually tagged
3. **Copy-paste artifacts**: Browser selection may include UI elements
4. **Length**: Large document requiring chunking consideration

## Test Coverage

This file should be used for:

- [ ] Parser accuracy testing
- [ ] Provenance extraction validation
- [ ] UI ingestion flow testing
- [ ] Search/retrieval quality testing

## Related Artifacts

- `GPT-original-seed.txt` — ChatGPT counterpart from same research sprint
- `gemini-2.txt` — Extended Gemini outputs from related sessions
- Mentioned in `01_THE_NORTH_STAR.md` as canonical use case

## Notes

> The absurd friction of this workflow — bouncing across ChatGPT, Gemini, Google Keep, plaintext editor, Obsidian, manual Ctrl+A/Ctrl+V — is the entire reason SlopVault exists.
>
> If the product doesn't make *this specific workflow* dramatically better, it has failed.
