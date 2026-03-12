# INGESTION_CORPUS.md

## Purpose

This repo keeps an **active ingestion test corpus** on disk so the parser/ingestion pipeline can be developed against real-ish mess.

It is not app source code.
It is not the same thing as the route `/dump` (the app UI).
It is not the same thing as `tests/fixtures/` (reduced goldens for automated tests).

## Naming Collision (Important)

- Route `/dump` = the ingestion UI ("The Dumpster").
- Folder `dump/` = the on-disk corpus used for ingestion testing.

## Roles

- `dump/`
  Shared corpus structure and (sanitized) samples that can live in git.
- `dump/_private/` (gitignored)
  Full-fidelity sensitive exports. Never commit.
- `dump/_local/` (gitignored)
  Personal scratch space and WIP samples. Never commit.
- `tests/fixtures/`
  Small stable fixtures used by tests.

## Canonical MVP Seed Files

These are repo-root canonical materials (not inside `dump/`):

- `GPT-original-seed.txt`
- `gemini-2.txt`

Provider bucket READMEs may reference them via relative paths.

## Manifest Convention

- Per-sample sidecar: `MANIFEST-{filename}.md`
  Example: `dump/MANIFEST-gemini-raw-seed.md`
- Optional per-directory index: `MANIFEST.md`
  Use only when you need a directory-level inventory (not as a replacement for per-sample sidecars).

## Working Rules

- Preserve raw files exactly when possible.
- Add sidecars/manifests instead of editing source exports.
- Treat anything in `_private/` and `_local/` as sensitive by default.
- Derive minimal fixtures into `tests/fixtures/` when a case should be automated.
