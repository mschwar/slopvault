# CURRENT_STATE.md

## Snapshot

Date of takeover packet refresh: 2026-03-11

The repo is an implemented prototype with stale scaffolding docs layered on top of it. The app exists. The problem is coherence, not absence.

## Confirmed Working

- `npm test`
  Passed 17 tests across preview classification, provider-specific extraction, and the local ingestion service.
- `npm run build`
  Succeeded and produced routes for `/`, `/dump`, `/vault`, and the `/api/ingestions` endpoints.
- Client preview flow
  `src/lib/ingest.ts` classifies:
  conversation paste, provider export JSON, standalone prompts, standalone text artifacts, images, and audio links.
- Canonical ingestion flow (unified 2026-03-11)
  `/dump` creates a draft via `POST /api/ingestions/create`, analyzes via `POST /api/ingestions/[id]/analyze`, then commits via `POST /api/ingestions/[id]/commit`. All artifacts stored in `/tmp/slopvault-local-store/store.json`.
  `/vault` reads committed artifacts via `GET /api/ingestions`.
- Server ingestion service
  `src/lib/ingestions/service.ts` supports:
  create draft, analyze, edit staged items, commit, discard, and dashboard snapshot.
- Provider extraction coverage
  Fixtures exist for ChatGPT web, Claude web/desktop, Gemini web, Grok web, Codex CLI, Claude Code, and Gemini AI Studio.

## Unverified

- Browser runtime behavior in this sandbox
  `npm run dev` could not bind to port 3000 here because the environment returned `listen EPERM`.
- The hidden API-backed UI
  `src/components/ingest/ingest-hub.tsx` compiles but is not mounted on a route, so no end-to-end browser path exercises it.
- Supabase migration application
  The repo has not been validated against a real local or remote Supabase instance in this takeover pass.
- Responsive behavior and visual polish in a browser
  The CSS compiles and the routes build, but no interactive visual review was possible in this sandbox.

## Appears Broken Or Disconnected

- The hidden API-backed UI (orphaned)
  `src/components/ingest/ingest-hub.tsx` was the intended review-and-commit UI but is not mounted on any route. It has been superseded by the wired `/dump` flow. Can be removed in a cleanup pass.
- Supabase migration application
  The repo has not been validated against a real local or remote Supabase instance in this takeover pass.
- Responsive behavior and visual polish in a browser
  The CSS compiles and the routes build, but no interactive visual review was possible in this sandbox.
- Browser runtime behavior in this sandbox
  `npm run dev` could not bind to port 3000 here because the environment returned `listen EPERM`.

## Stale Or Conflicting Docs / Code Areas

- `TECH_STACK.md`
  Now explicitly marked as target-state guidance, but still describes the intended Tailwind + Supabase stack rather than the current runtime.
- `APP_FLOW.md`
  Now explicitly marked as target-state guidance, but still describes intended routes beyond the implemented app.
- `DESIGN_SYSTEM.md` and related design docs
  Useful for visual intent, but they should be read as target-state guidance rather than proof of implemented routes or stack choices.
- Concept docs
  Still useful for product intent, but not reliable for runtime state.

## Immediate Repo Risks

- The partial migration creates a false sense of database readiness.
- The repo-root `dump/` corpus remains a broad mixed holding area, so provider vs export-method expectations are still under-documented (especially under `dump/google-dump/`).
- Large/private exports can be accidentally committed unless they live in a gitignored folder (use `ingestion-corpus/` for full-fidelity private dumps).
- The corpus contains many code-like filenames that can confuse broad repo searches unless agents intentionally scope their search.
- User-specific Obsidian state is tracked in git.

## Recommended Next Stabilization Step

Gate 1 is now complete. The canonical ingestion path is wired: `/dump` → `/api/ingestions` → `/vault`.

Next: Address the orphaned IngestHub component (remove or document as deprecated), then proceed to Gate 2 for durable persistence.
