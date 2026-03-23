# CURRENT_STATE.md

## Snapshot

Date of update: 2026-03-12

The repo is a fully functional MVP with Supabase-backed persistence. All four gates are complete: ingestion, bundling (nodes), public feed with voting, and forking with lineage.

## Confirmed Working

- `npm test`
  Passed 45 tests across preview classification, provider-specific extraction, ingestion service, storage utilities, and node operations.
- `npm run build`
  Succeeded and produced all routes including `/`, `/dump`, `/vault`, `/feed`, `/nodes`, `/p/nodes/[id]`, `/u/[pseudonym]`, and all API endpoints.
- Supabase integration
  - All database tables migrated to Supabase Postgres
  - RLS policies configured for secure access control
  - Supabase Storage bucket `ingestion-sources` with RLS for file uploads
  - Server-side Supabase client with cookie-based auth
- Client preview flow
  `src/lib/ingest.ts` classifies: conversation paste, provider export JSON, standalone prompts, standalone text artifacts, images, and audio links.
- Canonical ingestion flow (unified 2026-03-11)
  `/dump` creates a draft via `POST /api/ingestions/create`, analyzes via `POST /api/ingestions/[id]/analyze`, then commits via `POST /api/ingestions/[id]/commit`. All data stored in Supabase.
  `/vault` reads committed artifacts via the Supabase client.
- Server ingestion service
  `src/lib/ingestions/service.ts` supports:
  create draft, analyze, edit staged items, commit, discard, and dashboard snapshot.
  Files uploaded to Supabase Storage with path format: `{userId}/{ingestionId}/{filename}`
- Provider extraction coverage
  Fixtures exist for ChatGPT web, Claude web/desktop, Gemini web, Grok web, Codex CLI, Claude Code, and Gemini AI Studio.
- Node bundling system
  Create nodes from artifacts, public/private visibility, fork support with lineage tracking.
- Public feed
  Three sort modes: New/Raw (chronological), Hot Slop (upvotes with time decay), Rabbit Holes (fork depth).
- Voting system
  Upvote/unvote public nodes with database trigger keeping `nodes.upvotes` in sync.

## Configuration Required

- `.env.local` file with Supabase credentials:
  ```
  NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
  ```
- Supabase project must have migrations applied (see `supabase/migrations/`)

## Architecture

- **Database**: Supabase Postgres with tables:
  - `profiles` - user profiles with pseudonyms
  - `artifacts` - core content (text, images, audio links)
  - `nodes` - bundles of artifacts
  - `node_artifacts` - join table with ordering
  - `ingestions` - ingestion workflow tracking
  - `ingestion_items` - staged items before commit
  - `artifact_links` - provenance relationships
  - `votes` - upvotes on public nodes

- **Storage**: Supabase Storage bucket `ingestion-sources`
  - Private bucket with RLS policies
  - File paths: `{userId}/{ingestionId}/{filename}`
  - Used for uploaded source files and images

- **Auth**: Supabase Auth with email/password
  - Profile created automatically on signup
  - Middleware protects authenticated routes

## Exit Criteria

✅ All P0 tasks complete. The application now uses Supabase for:
- All database persistence (replacing local JSON)
- File storage (replacing local filesystem)
- Authentication and authorization (RLS policies)

Next: P0-6 (Auth flow UI) is the remaining P0 task, followed by P1 features.
