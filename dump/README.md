# Dump Root

This directory holds raw exports, pasted transcripts, and other source material used to test parsing, provenance capture, and future lineage reconstruction.

## Directory Structure

```
dump/
├── README.md                 # This file
├── _private/                 # Full-fidelity sensitive exports (gitignored)
├── _local/                   # Personal WIP/scratch space (gitignored)
├── anthropic-dump/           # Claude exports and raw material
├── google-dump/              # Google AI (Gemini, AI Studio) exports
├── openai-dump/              # ChatGPT exports and raw material
├── xai-dump/                 # Grok/xAI exports and raw material
│
├── MANIFEST-{sample}.md      # Sidecar manifests for key samples
├── gemini-raw-seed.md        # Canonical test case (Gemini)
├── GPT-firstpass.md          # OpenAI sample
├── Grok-firstpass.md         # xAI sample
└── (plus provider directories and optional sidecars)
```

## Canonical Repo-Root Seed Files

These canonical MVP seed materials live at the repo root (not inside `dump/`):

- [`GPT-original-seed.txt`](../GPT-original-seed.txt)
- [`gemini-2.txt`](../gemini-2.txt)

## Quick Reference

| Directory | Purpose | See README |
|-----------|---------|------------|
| `anthropic-dump/` | Claude exports | [README](anthropic-dump/README.md) |
| `google-dump/` | Gemini/AI Studio exports | [README](google-dump/README.md) |
| `openai-dump/` | ChatGPT exports | [README](openai-dump/README.md) |
| `xai-dump/` | Grok exports | [README](xai-dump/README.md) |
| `_private/` | Sensitive full exports | [README](_private/README.md) |
| `_local/` | Personal scratch space | [README](_local/README.md) |

## Working Rules

1. **Preserve raw files** — Keep source material as close to original format as possible
2. **Add sidecars, don't edit** — Prefer `MANIFEST-{filename}.md` sidecars instead of cleaning source data
3. **Provider-native exports preferred** — Account exports over copy-paste when available
4. **Preserve filenames** — Original names may contain useful metadata
5. **Sensitive data to `_private/`** — Full exports with PII stay local-only

## Manifest Convention

For important samples, create a `MANIFEST-{filename}.md` sidecar:

```markdown
# Manifest: {filename}

## Sample Info
| Field | Value |
|-------|-------|
| Filename | {filename} |
| Provider | {anthropic|openai|google|xai} |
| Source Surface | {web|app|cli|export} |
| Export Method | {account-export|copy-paste|api} |

## Provenance Expectations
- Detectable: model, timestamp, conversation_id
- Missing: (any expected but absent signals)

## Ingestion Kind
- Format: text/markdown (or application/json, etc.)
- Parser: {parser-name}
- Expected output: Clean Markdown + metadata JSON

## Test Coverage
- [ ] Parser accuracy
- [ ] Provenance extraction
```

## Future Sources To Add

- `openclaw/` — OpenClaw CLI dumps
- `codex/` — Codex CLI session exports
- `claude-code/` — Claude Code CLI outputs
- `cursor/` — Cursor editor AI interactions
- `agent-apps/` — Codex app, Claude Cowork, Antigravity

## Future Documentation

- Export walkthrough guides for each provider
- Capture guides for surfaces without clean exports
- Source-of-truth file location notes per platform

## See Also

- [INGESTION_CORPUS.md](/INGESTION_CORPUS.md) — Overall corpus documentation
- [SCHEMA.md](/SCHEMA.md) — Data model for parsed artifacts
- [AGENTS.md](/AGENTS.md) — Agent operating rules (corpus hygiene rules live here too)
