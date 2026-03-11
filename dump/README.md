# Dump Root

This directory holds raw exports, pasted transcripts, and other source material used to test parsing, provenance capture, and future lineage reconstruction.

## Current Structure

- `anthropic-dump/`: Claude exports and related raw material
- `google-dump/`: Google AI Studio and other Google-origin material
- `openai-dump/`: ChatGPT exports and related raw material
- `xai-dump/`: xAI exports and related raw material

## Future Sources To Add

- `openclaw` dump
- CLI dumps
  - Note: these are a pain to collect because they may be scattered across many local repos and session directories.
- actual agentic app dumps
  - Codex app
  - Claude Cowork
  - Antigravity

## Future Docs To Add

- export walkthrough guides for each provider
- capture walkthrough guides for surfaces without clean exports
- notes on where the strongest source-of-truth files live for each platform

## Working Use

- keep raw material as close to source format as possible
- prefer provider-native exports when available
- preserve filenames and any provider metadata that may help later trace reconstruction
