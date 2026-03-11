# SlopVault

**Status: Greenfield / Pre-implementation**

SlopVault is a platform for AI creators to capture, parse, organize, retrieve, and optionally share their AI-generated work with strong provenance. It addresses a specific pain point: generative AI makes creation cheap and infinite, but the prompts, outputs, uploads, and iterations that produced the work get scattered across siloed tools with no unified home.

SlopVault combines the private archiving of Obsidian, the gritty accessibility of Reddit, and the lineage instincts of Git, but the first MVP is intentionally artifact-first. Users save prompts, outputs, images, links, and related artifacts into a private vault while the system quietly captures provenance signals behind the scenes. The long-term differentiator is the ability to reconstruct how an idea evolved across models, surfaces, and revisions, but that trace capability is built on top of a useful single-player vault, not instead of it.

## What This Repo Contains Today

This repo is a concept workspace, not a running application. It contains:

- **Concept notes** (`01_THE_NORTH_STAR.md`, `02_THE_BUSINESS_MEMO.md`, `03_THE_PRD_AND_SCHEMA.md`) — the distilled product vision, business case, and initial schema thinking.
- **Raw brainstorm dumps** (`dump/`, `GPT-original-seed.txt`, `gemini-2.txt`) — the original multi-platform research sessions that both inspired and demonstrated the problem SlopVault solves.
- **Project scaffolding docs** — `PRD.md`, `ARCHITECTURE.md`, `ROADMAP.md`, `BACKLOG.md`, `AGENTS.md`, `RUNBOOK.md`, `SCHEMA.md` — structured handoff documents for implementation.
- **Scratchpad notes** (`scratchpad/`) — exploratory working notes and sketches. Useful for thinking, but not the source of truth.

There is no application code yet. That is intentional.

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
├── SCHEMA.md                  # Data model and API surface
├── .gitignore
├── .gitattributes
│
├── 01_THE_NORTH_STAR.md       # Original vision doc
├── 02_THE_BUSINESS_MEMO.md    # Business case / pitch framing
├── 03_THE_PRD_AND_SCHEMA.md   # Initial PRD and schema sketch
│
├── dump/                      # Raw brainstorm sessions (archival)
│   ├── GPT-firstpass.md
│   ├── gemini-raw-seed.md
│   └── Grok-firstpass.md
├── GPT-original-seed.txt      # Original ChatGPT research session
├── gemini-2.txt               # Gemini research / framework session
├── scratchpad/                # Exploratory notes and layout sketches
│
├── src/                       # Application source (empty, awaiting Phase 0)
│   ├── app/                   # Next.js app directory (placeholder)
│   ├── lib/                   # Shared utilities, parsers, DB clients
│   └── components/            # React components
│
└── supabase/
    └── migrations/            # SQL migration files (placeholder)
```

## How to Continue From Here

1. Read `AGENTS.md` for operating rules.
2. Read `PRD.md` and `ARCHITECTURE.md` to understand the artifact-first MVP and the hidden provenance-ledger direction.
3. Check `BACKLOG.md` for the current implementation order.
4. Follow `ROADMAP.md` for phased milestones.
5. Use `RUNBOOK.md` for day-to-day orientation.

The immediate next steps are **P0-1** (initialize the Next.js app), **P0-3** (build the parser/import pipeline for raw paste and provider export inputs), **P0-4** (write parser tests from the founder's real source material), and **P0-5** (normalize provenance signals so later trace reconstruction has a solid spine). See `BACKLOG.md` for specifics.
