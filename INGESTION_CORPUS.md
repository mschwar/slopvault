# INGESTION_CORPUS.md

## Purpose

This repo uses **repo-root `dump/`** as the active ingestion test corpus and holding area for raw source material used to build and test the ingestion pipeline.

It is not app source code.
It is not the same thing as the route `/dump` (the app UI).
It is not the same thing as `tests/fixtures/`.

Naming collision note:

- Route `/dump` = the ingestion UI (“The Dumpster”).
- Folder `dump/` = the on-disk corpus used for testing the ingestion pipeline.

## Roles

- `dump/`
  Active ingestion test corpus and holding area (provider buckets and export-method experiments)
- `tests/fixtures/`
  Reduced goldens used by automated tests
- `/dump`
  User-facing app route for the ingestion MVP

Optional local-only corpus:

- `ingestion-corpus/` (gitignored)
  Full-fidelity user exports that should not be committed (often large and sensitive)

## Current Structure

```text
dump/
  openai-dump/
  anthropic-dump/
  google-dump/
  xai-dump/
```

These are provider buckets first.
Some are already close to one export method.
Some (especially `google-dump/`) are still mixed holding areas and need later normalization by export method or source surface.

## What Each Sample Should Tell Us

For parser or ingestion work, each meaningful sample should eventually make four things obvious:

1. provider
2. export or capture method
3. expected ingestion path
4. expected provenance signals

## Recommended Organization

Preferred long-term shape:

```text
dump/
  openai/
    chatgpt-account-export/
    chatgpt-web-copy/
    codex-cli/
  anthropic/
    claude-export/
    claude-web-copy/
    claude-code/
  google/
    gemini-web-copy/
    gemini-ai-studio/
    google-takeout/
  xai/
    grok-web-copy/
    xai-export/
```

The repo is not fully there yet. When reorganizing, prefer adding structure around existing raw files rather than rewriting or cleaning the raw files themselves.

## Working Rules

- Preserve raw files exactly when possible.
- Add readmes, manifests, and sidecar notes instead of editing source data.
- Derive small stable samples into `tests/fixtures/` for automation.
- Do not treat code-like files in the corpus as app code.
- Assume the corpus may contain sensitive material (do not commit private exports).

## Current Gaps

- `google-dump/` is still too broad and mixed.
- Export method is not always obvious from directory structure alone.
- There is no per-sample manifest standard yet.

## Immediate Next Improvement

Add lightweight per-provider notes and, for the most important samples, sidecar manifests that record:

- source provider
- source surface or export method
- file type
- intended ingestion kind
- known parser expectations
