# Google Dump

Google AI (Gemini, AI Studio) exports and related raw source material.

> **Note**: This directory is currently a mixed holding area. Future reorganization should group by source surface (Gemini web, AI Studio, etc.).

## Provider Info

- **Provider**: Google
- **Products**: Gemini (gemini.google.com), AI Studio (aistudio.google.com), API

## Export Methods

| Method | Location | Format | Notes |
|--------|----------|--------|-------|
| Google Takeout | [takeout.google.com](https://takeout.google.com) | JSON/HTML | All Google data including Gemini |
| Gemini Web Copy | gemini.google.com | Markdown-ish | Includes multi-turn and file uploads |
| AI Studio Export | aistudio.google.com | JSON | Structured prompt/output pairs |
| API/NotebookLM | Various | JSON | Programmatic outputs |

## Ingestion Path

```
Raw Export (varies by source)
    ↓
Parser: google-parser (variant by source surface)
    ↓
Extract:
  - If Takeout: My Activity format parsing
  - If Gemini web: Heuristic message separation
  - If AI Studio: Structured JSON extraction
    ↓
Provenance: model, timestamp, source_surface, file_attachments[]
    ↓
Output: Clean Markdown + metadata JSON
```

## Expected Provenance Signals

- `model`: e.g., "gemini-1.5-pro", "gemini-1.5-flash", "gemini-exp-1206"
- `source_surface`: "gemini-web", "ai-studio", "takeout"
- `timestamp`: ISO 8601 or Google timestamp format
- `file_attachments`: PDFs, images, audio files referenced in conversation
- `search_grounding`: Whether Gemini used Google Search

## Known Parsing Challenges

1. **Multi-modal inputs**: Heavy use of file uploads (PDFs, images, video)
2. **Grounding**: Search-augmented responses need special handling
3. **Takeout format**: Google's My Activity format is verbose and nested
4. **Mixed sources**: AI Studio vs Gemini web have different structures
5. **Deep Research**: New feature with structured output format

## Samples

| File | Source | Method | Description |
|------|--------|--------|-------------|
| `gemini-raw-seed.md` | Gemini Web | Copy-paste | Initial research sprint output |
| `gemini-2.txt` | Gemini Web | Copy-paste | Extended research material |
| *(many .txt files)* | Gemini Web | Copy-paste | Various conversation exports |

## Root-Level Files (in dump/)

- `gemini-raw-seed.md` — Seed material from Gemini
- `gemini-2.txt` — Extended Gemini outputs

## Subdirectory Organization (Current)

The `google-dump/` subdirectory contains numerous `.txt` files from various Gemini conversations. These need:

1. Inventory/cataloging
2. MANIFEST.md sidecars for key samples
3. Potential reorganization by export method

## Immediate TODO

- [ ] Create MANIFEST.md for `gemini-raw-seed.md` (canonical test case)
- [ ] Inventory and document key `.txt` files
- [ ] Define naming convention for mixed-source samples
- [ ] Consider splitting by source surface (gemini-web/ vs ai-studio/)

## Adding New Samples

1. Place raw export file in this directory
2. Create a `MANIFEST-{sample}.md` sidecar with:
   - Export date
   - Source surface (Gemini web, AI Studio, etc.)
   - Export method
   - Notable features (file uploads, grounding, deep research)
3. Update the Samples table above

## See Also

- [INGESTION_CORPUS.md](/INGESTION_CORPUS.md) — Overall corpus documentation
- [SCHEMA.md](/SCHEMA.md) — Data model for parsed artifacts
