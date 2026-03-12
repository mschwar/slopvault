# ARCHITECTURE.md — SlopVault Technical Architecture

## Current State

A working Next.js prototype exists with local ingestion service and file-based storage. The app runs at `/dump` (The Dumpster UI) and `/vault` (artifact browser), backed by `/api/ingestions/*` endpoints. Data is stored in a local JSON file (`$TMPDIR/slopvault-local-store/store.json` by default) — not Supabase yet.

**Naming collision to be aware of:**
- `/dump` (route) = The Dumpster ingestion UI in the Next.js app
- `dump/` (directory) = test corpus folder in repo root containing raw LLM exports

The current architecture is a local-first artifact vault with a hidden provenance ledger. Supabase integration is planned but not yet implemented.

## Proposed Target Architecture

### Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | Next.js 14+ (App Router) | React ecosystem, SSR/streaming where needed, API routes/server actions for parsing and artifact workflows, strong Vercel path |
| Styling | Tailwind CSS | Utility-first, dark-mode-native, fast iteration, matches the brutalist aesthetic |
| Database | Supabase (Postgres) | Managed Postgres with Row Level Security, built-in auth, storage buckets, and room for later provenance expansion |
| Auth | Supabase Auth | Email/password for MVP. OAuth and magic links can be added later without migration |
| Storage | Supabase Storage | For media files (images in MVP, audio/video later). Text artifacts stored directly in Postgres as Markdown |
| Deployment | Vercel (assumed) | Native Next.js hosting, previews, low friction for early shipping |
| Search | Postgres full-text search | Good enough for MVP artifact retrieval without adding another service |

### Component Architecture

```text
┌─────────────────────────────────────────────────────┐
│                     Next.js App                     │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │ Dumpster │  │  Stash   │  │ Artifact Detail  │  │
│  │ paste +  │  │ vault +  │  │ + provenance     │  │
│  │ upload   │  │ search   │  │ cues / links     │  │
│  └────┬─────┘  └────┬─────┘  └────────┬─────────┘  │
│       │             │                 │            │
│  ┌────▼────────────────────────────────▼─────────┐ │
│  │              API Routes / Actions             │ │
│  │  - parse raw text                             │ │
│  │  - CRUD artifacts                             │ │
│  │  - suggest / confirm related artifacts        │ │
│  │  - CRUD nodes (later phase)                   │ │
│  │  - feed queries / fork ops (later phase)      │ │
│  └──────────────────────┬────────────────────────┘ │
└─────────────────────────┼──────────────────────────┘
                          │
               ┌──────────▼──────────┐
               │      Supabase       │
               │                     │
               │  ┌───────────────┐  │
               │  │   Postgres    │  │
               │  │ artifacts,    │  │
               │  │ users, later  │  │
               │  │ nodes/public  │  │
               │  └───────────────┘  │
               │  ┌───────────────┐  │
               │  │     Auth      │  │
               │  └───────────────┘  │
               │  ┌───────────────┐  │
               │  │    Storage    │  │
               │  │ images/media  │  │
               │  └───────────────┘  │
               └─────────────────────┘
```

### The Parser — Core Component

The parser is the most important piece of custom logic. It takes raw copy-pasted LLM output and produces clean Markdown plus provenance-aware metadata.

```text
Raw paste input
      │
      ▼
┌─────────────┐
│  Detect     │  Identify source LLM and source surface from UI artifacts
│  Source     │  ("Thought for Xm Xs" = ChatGPT o-series, etc.)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Strip      │  Remove UI chrome: thinking indicators,
│  Artifacts  │  copy buttons, model labels, timestamp lines
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Detect     │  Heuristically split prompt from response
│  Structure  │  and normalize content into readable Markdown
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Emit       │  Capture best-effort provenance signals:
│ Provenance  │  source surface, timestamps, prompt fingerprints
└──────┬──────┘
       │
       ▼
Clean Markdown + metadata JSON
(source_model, detected_prompt, raw_length, parsed_length, optional provenance fields)
```

### Hidden Provenance Ledger

SlopVault's longer-term differentiator is the ability to reconstruct the journey of an idea across models, uploads, and revisions. The MVP does not need a visible seed-first interface to benefit from that direction, but it does need a solid spine under the hood.

For the first MVP:

- The user-facing unit is still the artifact.
- The parser and intake layer should capture provenance evidence whenever it is available.
- `artifacts.metadata` is the short-term home for best-effort provenance fields such as source surface, captured-at timestamps, and prompt-family fingerprints.
- Uploading official provider export files is part of MVP ingestion, even if it requires awkward user-side export steps.
- Artifact detail views should expose lightweight provenance surfaces such as related items, "same prompt family" hints, and manually confirmed links.
- Dedicated `seed` / `trace_step` tables are intentionally deferred until the artifact-first vault is working and the provenance evidence is trustworthy enough to support a visible journey UI.

### Data Flow — Core Loop

**Unified ingestion hub (primary):**

1. User opens one intake surface: "The Dumpster".
2. User pastes raw text, uploads provider export JSON/history, uploads standalone artifacts, uploads standalone prompts, or pastes an audio link.
3. Client classifies the input type and sends it to the appropriate parser/import route.
4. Parser or importer returns clean content, extracted metadata, and optional provenance signals.
5. User reviews the proposed import result, optionally edits, and adds tags.
6. Artifact records are saved to Postgres; media files are stored in Supabase Storage when applicable.
7. The system computes best-effort related-item suggestions using timestamps, source surface, prompt-family evidence, import context, and other captured signals.
8. Imported artifacts appear in the user's Stash (private vault) with provenance cues on their detail views.
9. The user can confirm, dismiss, or manually add links between related artifacts.

Supported ingestion paths inside the unified hub:

- copy-pasted conversations
- provider export JSON/history uploads
- standalone artifact uploads or paste, including batch artifact import up to 10 items
- standalone prompt uploads or paste
- audio-link intake

The user-facing rule is simple: bring whatever you have to one place. The system handles classification and routing.

**Bundling and publishing (later phases):**

9. User selects artifacts from the Stash and bundles them into a node/package when they want to present or share a rabbit hole.
10. Public feed, upvoting, and forking are added after the private vault and provenance-aware artifact workflows are solid.

## Tradeoffs

| Decision | Tradeoff |
|----------|----------|
| Heuristic parser vs. LLM-based parser | Heuristics are fast, free, and predictable but will miss edge cases. An LLM-based parser would be more accurate but adds cost, latency, and API dependency. **Start with heuristics, add LLM fallback later if needed.** |
| Artifact-first MVP with hidden ledger vs. visible seed-first UX | Artifact-first is simpler to ship and easier for the founder to evaluate. A visible seed/trace UX is more differentiated, but it depends on provenance capture being trustworthy. **Capture the evidence now; expose the richer model later.** |
| Supabase vs. custom backend | Supabase trades flexibility for speed-to-ship. Row Level Security handles auth-gated queries without custom middleware. Risk: vendor lock-in if we outgrow Supabase. Acceptable for MVP. |
| Text-focused vs. fully multi-modal MVP | MVP supports text (with full parsing), images (upload-only, no parsing), and audio links (URL storage). This covers the founder's actual workflow without requiring image/audio parsing. Video hosting is deferred. |
| Postgres full-text search vs. dedicated search engine | Postgres `tsvector` search is good enough for thousands of artifacts. Avoids another service. Migrate later if search quality or speed becomes a bottleneck. |

### Later-Phase Public Feed / "Rabbit Holes"

The "Rabbit Holes" feed mode remains part of the public product direction, but it is not the MVP center of gravity. It relies on `nodes` and `parent_node_id` fork trees, which are later-phase publishing mechanics rather than the primary storage model.

Approach: a `fork_depth` materialized column or a periodic background computation. For MVP-adjacent later work, a recursive CTE at query time is acceptable given low volume.

```sql
WITH RECURSIVE lineage AS (
  SELECT id, parent_node_id, 1 AS depth
  FROM nodes
  WHERE parent_node_id IS NOT NULL AND visibility = 'public'
  UNION ALL
  SELECT n.id, n.parent_node_id, l.depth + 1
  FROM nodes n
  JOIN lineage l ON n.parent_node_id = l.id
  WHERE n.visibility = 'public'
)
SELECT id, MAX(depth) as max_depth
FROM lineage
GROUP BY id
ORDER BY max_depth DESC;
```

## What Should Not Be Built Yet

- Video upload and hosting.
- AI-powered auto-tagging (use manual tags for MVP; auto-tagging is a strong post-MVP feature).
- A fully visible seed-first or graph-first workspace before the provenance spine is reliable.
- Real-time collaborative editing.
- Browser extension for one-click capture.
- API integrations with LLM providers (direct import from ChatGPT, etc.).
- Notification system.
- Admin dashboard or moderation tools (beyond basic report/hide).
- Mobile app.
- Payment/billing infrastructure.
