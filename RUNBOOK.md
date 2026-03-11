# RUNBOOK.md — How to Work in This Repo

## Orienting Yourself

This is a greenfield project. No application code exists yet. The repo contains:

1. **Concept documents** (the `01_*`, `02_*`, `03_*` files and `dump/` folder) — these are the founder's original thinking. Read them for context but do not modify them.
2. **Project scaffolding docs** (this file, plus `README.md`, `AGENTS.md`, `PRD.md`, `ARCHITECTURE.md`, `ROADMAP.md`, `BACKLOG.md`, `SCHEMA.md`) — these are the structured handoff. They define what to build and how.
3. **Starter directories** (`src/app/`, `src/lib/`, `src/components/`) — empty placeholders for the Next.js application.

Start here:
- Read `AGENTS.md` for rules and constraints.
- Read `PRD.md` for what the product does.
- Read `BACKLOG.md` for what to do next.

## Commands

As of this writing, no application code exists. Once the Next.js project is initialized (P0-1), the expected commands are:

```bash
npm install          # Install dependencies
npm run dev          # Start development server
npm run build        # Production build
npm run test         # Run tests (once test framework is added)
```

Supabase CLI commands (once configured):

```bash
npx supabase start   # Start local Supabase instance
npx supabase db push # Apply migrations to remote
npx supabase gen types typescript --local  # Generate TypeScript types from schema
```

## Validating Progress

After any implementation work, check:

1. **Does `npm run dev` still start?** If not, fix it before doing anything else.
2. **Does the parser handle the test cases?** Run parser tests. If any fail, the parser is the priority.
3. **Does it look right in dark mode?** Open the browser. If anything renders with a white background or light-mode defaults, fix it immediately.
4. **Does auth work?** Can you sign up, sign in, and see only your own data?
5. **Does the schema match `SCHEMA.md`?** If you changed the database, update `SCHEMA.md` to match.

## Adding Structure Without Drifting

The main risk in a greenfield project is building things that sound useful but aren't on the critical path. Before adding any new file, component, or feature, ask:

1. **Is this in `BACKLOG.md`?** If not, is it a prerequisite for something that is?
2. **Does this serve the core loop?** (Paste → parse → save → retrieve.) If it's unrelated to that loop and we're still in Phase 0 or 1, it should wait.
3. **Am I adding a dependency?** New npm packages should be justified. Prefer standard library and Supabase built-ins over adding packages.
4. **Am I changing the schema?** Schema changes must be documented in `SCHEMA.md` with rationale. Do not add columns or tables without updating the doc.

## File Organization Conventions

```
src/
├── app/                    # Next.js App Router pages and layouts
│   ├── layout.tsx          # Root layout (dark mode, nav)
│   ├── page.tsx            # Landing / home page
│   ├── (auth)/             # Auth route group
│   │   ├── login/
│   │   └── signup/
│   ├── dump/               # The Dumpster (paste + parse)
│   ├── stash/              # The Stash (private vault)
│   ├── node/               # Node detail views
│   └── feed/               # Public feed (Phase 2+)
├── lib/                    # Shared utilities
│   ├── supabase.ts         # Supabase client setup
│   ├── parser.ts           # The raw-text parser
│   └── parser.test.ts      # Parser test cases
└── components/             # Reusable React components
    ├── ui/                 # Generic UI primitives
    └── artifacts/          # Artifact-specific components
```

This structure is a recommendation, not a rigid mandate. Adjust if Next.js conventions or practical needs dictate otherwise, but document the reasoning.
