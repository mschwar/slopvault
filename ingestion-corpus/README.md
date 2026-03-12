# Ingestion Corpus

This directory is the repo's active holding area for raw source material used to build and test the ingestion pipeline.

## What Belongs Here

- full provider export histories
- raw copied conversations
- upload samples that exercise edge cases
- high-fidelity source material that is too large or too messy for `tests/fixtures/`

## What Does Not Belong Here

- runtime app code
- reduced automated fixtures
- cleaned output that should live in `tests/fixtures/`

## Directory Meaning

- `openai/`
  OpenAI-origin samples
- `anthropic/`
  Anthropic-origin samples
- `google/`
  Google-origin samples
- `xai/`
  xAI-origin samples

The goal is provider first, then export method or source surface.

## Current Reality

Some directories are already close to one method.
Some are mixed holding areas.
That is acceptable for now, but every new addition should make provider and export method clearer, not less clear.

See [INGESTION_CORPUS.md](/Users/mschwar/Documents/slopvault/INGESTION_CORPUS.md) for repo-level rules.
