# SlopVault

**Status: Greenfield / Pre-implementation**

SlopVault is a platform for AI creators to capture, organize, and share their AI-generated work. It addresses a specific pain point: generative AI makes creation cheap and infinite, but curation, retrieval, and social circulation of that output remain fundamentally broken. Content gets scattered across ChatGPT histories, Midjourney Discord channels, local Downloads folders, and a dozen other silos with no unified home.

SlopVault combines the private archiving of Obsidian, the public gallery feel of DeviantArt, the discovery feed of Reddit, and the lineage tracking of Git — all purpose-built for AI-native artifacts.

## What This Repo Contains Today

This repo is a concept workspace, not a running application. It contains:

- **Concept notes** (`01_THE_NORTH_STAR.md`, `02_THE_BUSINESS_MEMO.md`, `03_THE_PRD_AND_SCHEMA.md`) — the distilled product vision, business case, and initial schema thinking.
- **Raw brainstorm dumps** (`dump/`, `GPT-original-seed.txt`, `gemini-2.txt`) — the original multi-platform research sessions that both inspired and demonstrated the problem SlopVault solves.
- **Project scaffolding docs** — `PRD.md`, `ARCHITECTURE.md`, `ROADMAP.md`, `BACKLOG.md`, `AGENTS.md`, `RUNBOOK.md`, `SCHEMA.md` — structured handoff documents for implementation.

There is no application code yet. That is intentional.

## Repo Structure

```
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
│
└── src/                       # Application source (empty, awaiting Phase 1)
    ├── app/                   # Next.js app directory (placeholder)
    ├── lib/                   # Shared utilities, parsers, DB clients
    └── components/            # React components
```

## How to Continue From Here

1. Read `AGENTS.md` for operating rules.
2. Read `PRD.md` and `ARCHITECTURE.md` to understand what we're building and how.
3. Check `BACKLOG.md` for the prioritized list of first moves.
4. Follow `ROADMAP.md` for phased milestones.
5. Use `RUNBOOK.md` for day-to-day orientation.

The immediate next step is **Phase 0, Task 1**: initialize a Next.js project with Supabase integration and build the raw-text parser ("The Dumpster"). See `BACKLOG.md` for specifics.
