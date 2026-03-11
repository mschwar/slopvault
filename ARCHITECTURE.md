# ARCHITECTURE.md — SlopVault Technical Architecture

## Current State

No application code exists. The repo contains concept documents and raw brainstorm sessions. The tech stack direction is stated in the founder's notes but nothing has been initialized.

## Proposed Target Architecture

### Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | Next.js 14+ (App Router) | React ecosystem, SSR for public feed SEO, API routes for backend logic, strong Vercel deployment path |
| Styling | Tailwind CSS | Utility-first, dark-mode-native, fast iteration, matches the brutalist aesthetic |
| Database | Supabase (Postgres) | Managed Postgres with Row Level Security, built-in auth, real-time subscriptions, storage buckets |
| Auth | Supabase Auth | Email/password for MVP. OAuth and magic links can be added later without migration. |
| Storage | Supabase Storage | For media files (images, audio) in later phases. Text artifacts stored directly in Postgres. |
| Deployment | Vercel (assumed) | Native Next.js hosting, preview deployments, edge functions |
| Search | Postgres full-text search | Sufficient for MVP. Can migrate to dedicated search (Meilisearch, Typesense) if needed later. |

### Component Architecture

```
┌─────────────────────────────────────────────────┐
│                   Next.js App                    │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │  Dumpster │  │  Stash   │  │  Public Feed  │  │
│  │  (paste   │  │  (vault  │  │  (browse,     │  │
│  │  + parse) │  │  + search)│  │  vote, fork)  │  │
│  └─────┬─────┘  └─────┬────┘  └───────┬───────┘  │
│        │              │               │          │
│  ┌─────▼──────────────▼───────────────▼───────┐  │
│  │              API Routes / Actions           │  │
│  │  - parse raw text                           │  │
│  │  - CRUD artifacts                           │  │
│  │  - CRUD nodes                               │  │
│  │  - feed queries                             │  │
│  │  - fork operations                          │  │
│  └─────────────────────┬──────────────────────┘  │
│                        │                         │
└────────────────────────┼─────────────────────────┘
                         │
              ┌──────────▼──────────┐
              │     Supabase        │
              │                     │
              │  ┌───────────────┐  │
              │  │   Postgres    │  │
              │  │  (artifacts,  │  │
              │  │   nodes,      │  │
              │  │   users)      │  │
              │  └───────────────┘  │
              │  ┌───────────────┐  │
              │  │   Auth        │  │
              │  └───────────────┘  │
              │  ┌───────────────┐  │
              │  │   Storage     │  │
              │  │  (media,      │  │
              │  │   later)      │  │
              │  └───────────────┘  │
              └─────────────────────┘
```

### The Parser — Core Component

The parser is the most important piece of custom logic. It takes raw copy-pasted LLM output and produces clean Markdown with extracted metadata.

```
Raw paste input
      │
      ▼
┌─────────────┐
│  Detect     │  Identify source LLM from UI artifacts
│  Source     │  ("Thought for Xm Xs" = ChatGPT o-series,
│             │   "Claude" attribution, etc.)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Strip      │  Remove UI chrome: thinking indicators,
│  Artifacts  │  copy buttons, model labels, timestamps
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Detect     │  Heuristically split prompt from response
│  Structure  │  using patterns (short line → long block)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Format     │  Normalize to clean Markdown,
│  Output     │  fix broken code blocks, normalize headers
└──────┬──────┘
       │
       ▼
Clean Markdown + metadata JSON
(source_model, detected_prompt, timestamp)
```

### Data Flow — Core Loop

1. User pastes raw text into "The Dumpster" (a large textarea).
2. Client sends raw text to a server action or API route.
3. Parser processes text → returns clean Markdown + metadata.
4. User reviews parsed output, optionally edits, adds tags.
5. Artifact is saved to Postgres with parsed content and metadata.
6. Artifact appears in user's Stash (private vault).
7. (Later) User can bundle artifacts into Nodes, publish to feed.

## Tradeoffs

| Decision | Tradeoff |
|----------|----------|
| Heuristic parser vs. LLM-based parser | Heuristics are fast, free, and predictable but will miss edge cases. An LLM-based parser would be more accurate but adds cost, latency, and API dependency. **Start with heuristics, add LLM fallback later if needed.** |
| Supabase vs. custom backend | Supabase trades flexibility for speed-to-ship. Row Level Security handles auth-gated queries without custom middleware. Risk: vendor lock-in if we outgrow Supabase. Acceptable for MVP. |
| Text-only MVP vs. multi-modal MVP | Text-only reduces scope dramatically. Images and audio add storage costs, rendering complexity, and parser complexity. **Text-only is the right call for initial launch.** |
| Next.js App Router vs. Pages Router | App Router is the future of Next.js but has some rough edges. Server Components and Server Actions reduce client-side JS. Worth the learning curve. |
| Postgres full-text search vs. dedicated search engine | Postgres `tsvector` search is good enough for thousands of artifacts. Avoids another service. Migrate later if search quality or speed becomes a bottleneck. |

## What Should Not Be Built Yet

- Image/audio/video upload and rendering pipeline.
- AI-powered auto-tagging (use manual tags for MVP).
- Real-time collaborative editing.
- Browser extension for one-click capture.
- API integrations with LLM providers.
- Notification system.
- Admin dashboard or moderation tools (beyond basic report/hide).
- Mobile app.
- Payment/billing infrastructure.
