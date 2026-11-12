# SlopVault

## TL;DR

Paste raw AI chat transcripts, upload provider history JSON files, or drop images and audio links into `/dump`. SlopVault strips chat interface clutter, extracts prompts and provenance metadata, stores immutable originals and clean Markdown in Supabase, and serves searchable private and shared views at `/vault`.

## Overview

**Status: Working Minimum Viable Product (MVP) prototype**

SlopVault is a web application where AI creators capture, parse, organize, retrieve, and share AI-generated work with preserved provenance. Generative AI makes creation cheap and fast, while the prompts, outputs, uploads, and iterations scatter across separate chat tools with no shared archive.

Users save prompts, outputs, images, links, and related items into a private vault while the intake pipeline records provenance signals in the background. That single-player vault supports later lineage reconstruction across models, chat surfaces, and revisions.

## What This Repo Contains Today

This repository contains a working Next.js prototype plus product documentation and ingestion test samples:

- **Concept notes** ([01_THE_NORTH_STAR.md](01_THE_NORTH_STAR.md), [02_THE_BUSINESS_MEMO.md](02_THE_BUSINESS_MEMO.md), [03_THE_PRD_AND_SCHEMA.md](03_THE_PRD_AND_SCHEMA.md)): product vision, business case, and initial schema notes.
- **Ingestion test corpus** (`dump/`): active holding folder used to test provider buckets and export formats. This folder holds raw sample data, not application code.
- **Raw research seeds** (`GPT-original-seed.txt`, `gemini-2.txt`, and samples under `dump/`): multi-platform research transcripts used as canonical parser test inputs.
- **Operating and design guides**: [AGENTS.md](AGENTS.md), [CLAUDE.md](CLAUDE.md), [PRD.md](PRD.md), [ARCHITECTURE.md](ARCHITECTURE.md), [APP_FLOW.md](APP_FLOW.md), [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md), [FRONTEND_GUIDELINES.md](FRONTEND_GUIDELINES.md), [ROADMAP.md](ROADMAP.md), [CURRENT_STATE.md](CURRENT_STATE.md), [BACKLOG.md](BACKLOG.md), [RUNBOOK.md](RUNBOOK.md), and [SCHEMA.md](SCHEMA.md).
- **Scratchpad notes** (`scratchpad/`): exploratory working sketches, not authoritative specifications.

## Quickstart

```bash
npm install
npm test
/usr/bin/python3 -m unittest tests/test_doc_hygiene.py -v
npm run dev
```

Production build:

```bash
npm run build
```

## App Entry Points

- Route `/dump`: unified ingestion screen for pasting transcripts, dropping files, previewing parsed output, and committing records.
- Route `/vault`: private artifact browser reading committed records from Supabase.
- API `/api/ingestions/*`: Supabase-backed ingestion endpoints (`create` -> `analyze` -> `commit`).
- Supabase Storage: `ingestion-sources` bucket protected by Row Level Security (RLS) policies.

## Repo Structure

```text
slopvault/
├── README.md                  # Repository overview and quickstart
├── AGENTS.md                  # Operating rules for agents continuing this work
├── CLAUDE.md                  # Tooling and skill routing rules
├── PRD.md                     # Product requirements document
├── ARCHITECTURE.md            # Technical architecture direction
├── APP_FLOW.md                # Screen hierarchy and user flows
├── DESIGN_SYSTEM.md           # Visual tokens and component recipes
├── FRONTEND_GUIDELINES.md     # Frontend layout and interaction rules
├── ROADMAP.md                 # Phased execution plan
├── BACKLOG.md                 # Prioritized task list
├── RUNBOOK.md                 # Day-to-day orientation guide
├── CURRENT_STATE.md           # Confirmed working routes, tests, and persistence
├── SCHEMA.md                  # Data model and API surface
├── .gitignore
├── CHANGELOG.md               # Release changelog
├── TODOS.md                   # Deferred work tracking
├── VERSION                    # Current version (4-digit format)
├── .gitattributes
│
├── 01_THE_NORTH_STAR.md       # Original vision document
├── 02_THE_BUSINESS_MEMO.md    # Business case and pitch framing
├── 03_THE_PRD_AND_SCHEMA.md   # Initial requirements and schema sketch
│
├── dump/                      # Active ingestion test corpus and holding area
├── GPT-original-seed.txt      # Original ChatGPT research session
├── gemini-2.txt               # Gemini research and framework session
├── scratchpad/                # Exploratory notes and layout sketches
│
├── src/                       # Application source (Next.js App Router + ingestion service)
├── tests/                     # Vitest suite plus Python stdlib test_doc_hygiene.py gate
└── supabase/
    └── migrations/            # SQL migration files
```

## How to Continue From Here

1. Read [AGENTS.md](AGENTS.md) for operating rules, branch discipline, and documentation hygiene checks.
2. Read [PRD.md](PRD.md) and [ARCHITECTURE.md](ARCHITECTURE.md) for the artifact-first MVP and provenance ledger design.
3. Read [CURRENT_STATE.md](CURRENT_STATE.md) to verify which routes, database tables, and tests are active.
4. Read [APP_FLOW.md](APP_FLOW.md), [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md), and [FRONTEND_GUIDELINES.md](FRONTEND_GUIDELINES.md) before changing screens or styles.
5. Follow [ROADMAP.md](ROADMAP.md), [BACKLOG.md](BACKLOG.md), and [RUNBOOK.md](RUNBOOK.md) for prioritized next tasks.
