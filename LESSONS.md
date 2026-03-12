# LESSONS.md

## 2026-03-11

- Do not lead the signed-in product with a public feed. Users come here first to stop losing work.
- The parser is backend-critical, but the frontend expression of that value is the Dump page and the saved artifact, not a graph.
- Sharing must start with the simplest valuable unit: a single artifact.
- For text artifacts, prompt + output is the natural share format when the prompt is available.
- Seed and journey matter, but they are advanced continuity surfaces. They should emerge from provenance, not replace the vault IA.
- `artifact` is the stable product term. `fruit` is optional flavor and should never become structural vocabulary without user validation.
- A three-rail layout is useful only when each rail has a clear job. Do not add inspectors or extra rails to screens that do not need them.
- Dark mode is not enough by itself. Contrast, hierarchy, and restraint make it feel intentional.
- If the value proposition is strong, users will tolerate awkward export steps. That makes provider export guidance and high-value import results MVP features, not edge-case documentation.
- The user should see one ingestion door, not four separate intake products.
- Classification should explain itself before save. Weak confidence is a feature when it prevents silent bad imports.
- A local demo vault is good enough to validate ingest UX before the real persistence layer exists, as long as the limitation is explicit in the interface and docs.

## 2026-03-11 — Ingestion UX Edge Cases and Data-Loss Prevention

### Two-Ingestion Model is Intentional (For Now)

`DumpWorkspace.handleSave()` intentionally creates **two separate ingestion drafts** when both text and files are present:
1. One `conversation_paste` / `prompt_only` / `source_json_upload` for the text
2. One `artifact_batch` for the files

**Why:** The ingestion service currently differentiates ingestion kinds at draft creation time. A single ingestion cannot be both a conversation paste and an artifact batch. The two-ingestion approach preserves user input rather than silently dropping either text or files.

**Server-side alternative considered:** We could change `createIngestionDraft` to accept a hybrid kind or defer kind resolution to analysis time. This would require schema changes and unified extraction logic. Not worth the complexity for MVP.

### Audio Links + Files

When the textarea is classified as an `audio_link` and files are present, the audio link is attached to the `artifact_batch` ingestion (so it is not dropped).

Test coverage:

- Service-layer: `audio-link-only ingest creates audio_link artifacts without data loss`
- UI save-planning: `buildDumpSavePlan forwards audio links to artifact_batch when files are present`
