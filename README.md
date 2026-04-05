# SlopVault

**Status: Working prototype (ingestion MVP)**

SlopVault is a platform for AI creators to capture, parse, organize, retrieve, and optionally share their AI-generated work with strong provenance. It addresses a specific pain point: generative AI makes creation cheap and infinite, but the prompts, outputs, uploads, and iterations that produced the work get scattered across siloed tools with no unified home.

SlopVault combines the private archiving of Obsidian, the gritty accessibility of Reddit, and the lineage instincts of Git, but the first MVP is intentionally artifact-first. Users save prompts, outputs, images, links, and related artifacts into a private vault while the system quietly captures provenance signals behind the scenes. The long-term differentiator is the ability to reconstruct how an idea evolved across models, surfaces, and revisions, but that trace capability is built on top of a useful single-player vault, not instead of it.

## What This Repo Contains Today

This repo contains a working Next.js app prototype plus concept/docs/corpus materials:

- **Concept notes** (`01_THE_NORTH_STAR.md`, `02_THE_BUSINESS_MEMO.md`, `03_THE_PRD_AND_SCHEMA.md`) — the distilled product vision, business case, and initial schema thinking.
- **Ingestion test corpus** (`dump/`) — an active holding area used to build and test the ingestion pipeline (provider buckets, export-method experiments). This is raw material, not app code.
- **Raw brainstorm dumps** (`GPT-original-seed.txt`, `gemini-2.txt`, plus some content under `dump/`) — the original multi-platform research sessions that inspired the product.
- **Operating docs** — `AGENTS.md`, `PRD.md`, `ARCHITECTURE.md`, `ROADMAP.md`, `BACKLOG.md`, `RUNBOOK.md`, `SCHEMA.md`, `CURRENT_STATE.md`.
- **Scratchpad notes** (`scratchpad/`) — exploratory working notes and sketches. Useful for thinking, but not the source of truth.

## Quickstart

```bash
npm install
npm test
npm run dev
```

Production build:

```bash
npm run build
```

## App Entry Points

- Route `/dump`: “The Dumpster” ingestion UI (paste + drop files, preview, commit).
- Route `/vault`: reads committed artifacts from the same local ingestion store as the API.
- API `/api/ingestions/*`: ingestion service backed by Supabase (draft -> analyze -> commit).
- Files uploaded to Supabase Storage (`ingestion-sources` bucket with RLS).

## Repo Structure

```text
slopvault/
├── README.md                  # You are here
├── AGENTS.md                  # Operating rules for agents continuing this work
├── PRD.md                     # Product requirements document
├── ARCHITECTURE.md            # Technical architecture direction
├── ROADMAP.md                 # Phased execution plan
├── BACKLOG.md                 # Prioritized task list
├── RUNBOOK.md                 # How to orient and work in this repo
├── CURRENT_STATE.md            # What is confirmed working vs broken right now
├── SCHEMA.md                  # Data model and API surface
├── .gitignore
├── CHANGELOG.md               # Release changelog
├── TODOS.md                   # Deferred work tracking
├── VERSION                    # Current version (4-digit format)
├── .gitattributes
│
├── 01_THE_NORTH_STAR.md       # Original vision doc
├── 02_THE_BUSINESS_MEMO.md    # Business case / pitch framing
├── 03_THE_PRD_AND_SCHEMA.md   # Initial PRD and schema sketch
│
├── dump/                      # Active ingestion test corpus + holding area (raw, may be messy)
├── GPT-original-seed.txt      # Original ChatGPT research session
├── gemini-2.txt               # Gemini research / framework session
├── scratchpad/                # Exploratory notes and layout sketches
│
├── src/                       # Application source (Next.js App Router + ingestion service)
│
├── tests/                    # Vitest unit and integration tests
│
└── supabase/
    └── migrations/            # SQL migration files
```

## How to Continue From Here

1. Read `AGENTS.md` for operating rules.
2. Read `PRD.md` and `ARCHITECTURE.md` to understand the artifact-first MVP and the hidden provenance-ledger direction.
3. Read `CURRENT_STATE.md` to see what is confirmed working right now.
4. Follow `ROADMAP.md` for phased milestones.
5. Use `RUNBOOK.md` for day-to-day orientation.

The immediate next steps are the current **P0** stabilization items in `BACKLOG.md` (keep the canonical ingest path stable, reduce data-loss edge cases, and get the test corpus organization under control). See `BACKLOG.md` for specifics.
