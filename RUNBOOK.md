# RUNBOOK.md — How to Work in This Repo

## Orienting Yourself

This repo is a working Next.js prototype for the ingestion MVP. It contains:

1. **Concept documents** (the `01_*`, `02_*`, `03_*` files) — the founder's original thinking. Preserve these as-is.
2. **Operating docs** (this file, plus `README.md`, `AGENTS.md`, `PRD.md`, `ARCHITECTURE.md`, `ROADMAP.md`, `BACKLOG.md`, `SCHEMA.md`, `CURRENT_STATE.md`) — the structured handoff. Prefer these over stale assumptions.
3. **Scratchpad notes** (`scratchpad/`) — exploratory thinking and sketches. Useful for product discovery, but not the source of truth.
4. **Application source** (`src/`) — Next.js app routes/components plus a local ingestion service (`/api/ingestions/*`).
5. **Ingestion test corpus** (`dump/`) — an active holding area used to build and test the ingestion pipeline. This is raw material, not app code. It may contain sensitive exports; treat it accordingly.

Important context: The founder is an anthropologist, not a developer. They evaluate the product by using it, not by reading code. Write self-documenting code. See `AGENTS.md` for the full founder context and the origin story that defines the product.

Start here:
- Read `AGENTS.md` for rules, constraints, and the founding use case.
- Read `PRD.md` for what the product does and the canonical test case.
- Read `CURRENT_STATE.md` for what is confirmed working right now.
- Read `BACKLOG.md` for what to do next.

## Commands

Core commands:

```bash
npm install          # Install dependencies
npm run dev          # Start development server
npm run build        # Production build
npm test             # Run tests
```

Supabase CLI commands (present but not validated in this repo pass):

```bash
npx supabase start   # Start local Supabase instance
npx supabase db push # Apply migrations to remote
npx supabase gen types typescript --local  # Generate TypeScript types from schema
```

## Validating Progress

After any implementation work, check:

1. **Do `npm test` and `npm run build` still pass?** If not, fix that before adding scope.
2. **Does `/dump` still commit artifacts into the local ingestion store?** If not, start by inspecting `/api/ingestions/*` routes and `src/lib/ingestions/service.ts`.
3. **Does provenance metadata look useful?** Verify that source model, source surface, timestamps, and other detectable signals are being captured rather than silently dropped.
4. **Do related-item suggestions feel reasonable?** If artifact-linking heuristics are clearly wrong, fix them or make them more conservative.
5. **Does it look right in dark mode?** Open the browser. If anything renders with a white background or light-mode defaults, fix it immediately.
6. **Does auth work?** Can you sign up, sign in, and see only your own data?
7. **Does the schema match `SCHEMA.md`?** If you changed the database, update `SCHEMA.md` to match.

## Adding Structure Without Drifting

The main risk is building “a platform” instead of shipping a reliable parser + vault loop. Before adding any new file, component, or feature, ask:

1. **Is this in `BACKLOG.md`?** If not, is it a prerequisite for something that is?
2. **Does this serve the core loop?** (Ingest → parse/import → save → retrieve → see provenance/related items → manually correct → share/publish.) If it's unrelated to that loop and we're still in Phase 0 or 1, it should wait.
3. **Am I adding a dependency?** New npm packages should be justified. Prefer standard library and Supabase built-ins over adding packages.
4. **Am I changing the schema?** Schema changes must be documented in `SCHEMA.md` with rationale. Do not add columns or tables without updating the doc.

## File Organization Conventions

```text
src/
├── app/                    # Next.js App Router pages and layouts
│   ├── layout.tsx          # Root layout (dark mode, nav)
│   ├── page.tsx            # Landing / home page
│   ├── (auth)/             # Auth route group
│   │   ├── login/
│   │   └── signup/
│   ├── dump/               # The Dumpster (unified ingestion hub)
│   ├── vault/              # The vault (currently local ingestion store)
│   ├── artifact/           # Artifact detail views and share pages
│   ├── node/               # Node detail views (later phase)
│   └── feed/               # Public feed (later phase)
├── lib/                    # Shared utilities
│   ├── ingest.ts           # In-browser ingest preview builder/classifier
│   ├── ingestions/         # Local ingestion service (store + extract + commit)
│   └── ingest-contract.ts  # Contract types used across ingest preview/UI
└── components/             # Reusable React components
    ├── ui/                 # Generic UI primitives
    ├── artifacts/          # Artifact-specific components
    └── provenance/         # Related-item and metadata surfaces
```

This structure is a recommendation, not a rigid mandate. Adjust if Next.js conventions or practical needs dictate otherwise, but document the reasoning.
