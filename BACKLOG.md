# BACKLOG.md — SlopVault Prioritized Task List

## P0 — Stabilization (Current)

The Next.js app exists with local file-based storage. P0 is about keeping the canonical ingest path stable and reducing data-loss edge cases.

### P0-1: ✅ Next.js project initialized
**Status:** Complete. Next.js App Router exists in `src/`. Styling is currently plain CSS (`src/app/globals.css`), not Tailwind. `npm run dev` works.

### P0-2: ✅ Migrate from local JSON to Supabase
**Status:** Complete. Database and storage migrated to Supabase:
- ✅ SQL migrations created (`profiles`, `artifacts`, `nodes`, `node_artifacts`, `votes`, `ingestions`, `ingestion_items`, `artifact_links`)
- ✅ RLS policies configured for all tables and storage bucket
- ✅ Supabase Storage bucket `ingestion-sources` created with RLS policies
- ✅ Ingestion service migrated from local filesystem to Supabase Storage
- ✅ File uploads now use Supabase Storage with user-scoped paths (`{userId}/{ingestionId}/{filename}`)
- ✅ All 27 tests passing, build succeeds

### P0-3: ⏳ Parser/import pipeline ("God-Tier Text Parser")
**Status:** Baseline implemented. Extraction logic lives in `src/lib/ingestions/extract.ts` and supports:
- Copy-pasted conversations from ChatGPT, Claude, Gemini, Grok
- Provider export JSON/history files
- Standalone prompts and standalone artifacts

**What it actually emits today (audited):**
- `sourceProvider` (`openai|google|anthropic|xai|unknown`) from heuristics + optional hint
- `sourceSurface` inferred per provider (e.g. `chatgpt-web`, `gemini-web`, `claude-web-desktop`)
- Extracted items with:
  - `contentRole` (`prompt|response|artifact|audio_link`)
  - `parsedMarkdown`
  - `metadata.content_role` always set
  - prompt-only: `metadata.prompt_fingerprint` and `metadata.prompt_family_fingerprint`
- Parser version constant: `PARSE_VERSION`

**Known gaps (still backlog):**
- Reliable `source_model` attribution beyond heuristics
- Timestamp capture/normalization
- Explicit `raw_length` / `parsed_length` fields

### P0-4: ✅ Parser test cases using the Substrate project
**Status:** Complete. Tests cover provider-specific extraction fixtures (`tests/extract.test.ts`) and include substrate corpus smoke tests that load real files from `dump/` (`tests/substrate.test.ts`). (20 tests passing.)

### P0-5: ⏳ Normalize provenance signals
**Status:** Partial. Provenance utilities exist in `src/lib/ingestions/fingerprints.ts` and the ingestion flow stores best-effort evidence in `artifacts.metadata`, but the full contract described in PRD/SCHEMA is not complete yet.

**Implemented:**
- Prompt fingerprints (`prompt_fingerprint`, `prompt_family_fingerprint`)
- Source provider and surface hints (best-effort)

**Missing (still required):**
- Timestamp capture/normalization
- More reliable model attribution
- Clear contract for which provenance fields are guaranteed vs best-effort

### P0-6: Build auth flow
Implement sign-up and sign-in pages using Supabase Auth (email/password). Create a `profiles` table row on sign-up with a user-chosen pseudonym (no real names, no profile photos). Protect vault routes with auth middleware.

---

## P1 — Core MVP features, build after P0 is solid

### P1-1: Build The Dumpster page (unified ingestion hub)
A massive, forgiving intake surface (full-screen feel) with a dominant "Parse" button. It must support copy-pasted conversations, provider export JSON/history uploads, standalone prompt uploads/paste, standalone artifact uploads/paste, and batch standalone artifact upload up to 10 items. On submit, call the parser/import pipeline and show a preview of the normalized result alongside extracted metadata. "Save to Stash" persists the artifact(s). Allow the user to add tags before saving. This is the hero feature — it must feel effortless.

### P1-2: Add provider export guidance to The Dumpster
Provide exact step-by-step guidance for exporting supported provider history files from inside The Dumpster page. At minimum cover ChatGPT, Claude, Gemini, and Grok. The guidance should explain which file the user should upload when that is known.

### P1-3: Build The Dumpster (standalone artifact upload)
Add drag-and-drop and file-picker support for standalone artifacts to The Dumpster page. At minimum support JPG/PNG image files cleanly and allow batch standalone artifact import up to 10 items. User adds tags and optional title/description. Saved as artifacts with provenance metadata when available.

### P1-4: Build The Dumpster (standalone prompts and audio links)
Add support for standalone prompt uploads/paste and a URL input field for audio links (Suno, Udio, SoundCloud, etc.). Validate the URL. Save prompt-first inputs and `audio_link` artifacts with the best provenance metadata available.

### P1-5: Build The Stash page
Grid or list view of all artifacts belonging to the authenticated user. Each card shows: title (auto-generated from first heading or first line for text; filename for images), preview snippet or thumbnail, source model badge, tags, creation date, and lightweight provenance cues where helpful. Filter by type (text/image/audio). Clicking a card opens the artifact detail view.

### P1-6: Build artifact detail view
Full rendered Markdown for text artifacts. Image display for image artifacts. Link embed or player for audio artifacts. Sidebar or header showing metadata: source model, source surface, detected prompt (if text), tags, creation date, raw vs. parsed character counts (if text). Share action should live directly on this screen. Edit button for tags and title.

### P1-7: Surface related artifacts and provenance cues
On artifact detail pages, show best-effort related artifacts and provenance signals such as:
- same prompt family
- close timestamp / likely same session
- derived-from or similar-source hints
- linked uploads or adjacent artifacts when available

### P1-8: Support manual confirmation and correction of links
Give the user a way to confirm suggested links, dismiss wrong ones, and manually connect artifacts when they know the system is missing context.

### P1-9: Implement search
Add full-text search using Postgres `tsvector` across artifact `parsed_markdown`, `title`, and `tags`. Search bar in the Stash page header. Results update as the user types (debounced).

### P1-10: Implement artifact visibility toggle
On individual artifacts, add a Private/Public toggle. Public artifacts are readable without auth via a shareable URL. Show prompt + result when available, plus recipe/provenance metadata on public artifacts.

---

## P2 — Bundling and optional sharing. Build only after P1 is working and tested.

### P2-1: Build Node creation flow
"New Node" button in the Stash. Multi-select artifacts of any type (text + images + audio links together), give the node a title, optional description, and a hook (short public-facing summary). Save. Node detail page shows bundled artifacts in sequence with mixed media. Nodes have their own Private/Public visibility toggle.

### P2-2: Build Node detail and management
Support editing node title/description/hook, adding/removing artifacts, and reordering artifacts. Node creation should feel like packaging existing vault content for presentation, not like a replacement for the underlying artifact model.

### P2-3: Build public/shareable node views
Support shareable public node pages and the visibility workflow that moves packaged work from private to public.

---

## P3 — Public feed and discovery. Build only after P2 is working and tested.

### P3-1: Build the public feed page
Masonry-style card layout of all public Nodes. Three sort modes:
- **"New/Raw"** — chronological firehose.
- **"Hot Slop"** — upvotes weighted by recency (time-decay algorithm).
- **"Rabbit Holes"** — sorted by fork-chain depth (deepest/most-forked lineage chains).

Paginated or infinite scroll. Each card shows: Node title, hook text, author pseudonym, upvote count, fork count, media type indicators.

### P3-2: Implement upvoting
Authenticated users can upvote public Nodes. One upvote per user per Node. Upvote count displayed on Node cards and detail pages. Trigger to keep `nodes.upvotes` in sync with `votes` table.

### P3-3: Build user profile page
Public page at `/u/{pseudonym}` showing the user's published Nodes. Minimal — pseudonym, join date, list of public Nodes. No follower counts, no social graph.

---

## P4 — Forking and public lineage. Build only after P3 is working and tested.

### P4-1: Implement the fork mechanic
"Fork" button on public Nodes. Creates a copy in the forking user's Stash with `parent_node_id` set. The forked Node can be edited (add/remove artifacts, change title) and republished. Parent and child Nodes display their lineage relationship.

### P4-2: Lineage tree visualization
On any Node with forks, show a visual tree or branching diagram of the fork chain. This powers the "Rabbit Holes" feed and makes public lineage navigable. Depth-limited to prevent performance issues on deep chains.

---

## Research / Clarification Tasks

These are not implementation tasks. They require investigation or founder decisions.

- **R1:** Test the parser against 20+ real pastes to identify failure modes for both cleaning and provenance capture. Pay special attention to Gemini's UI artifacts (watermark images, "Expand to view" controls).
- **R2:** Define prompt normalization and prompt-family fingerprinting rules. What should be removed, preserved, or hashed?
- **R3:** Evaluate Supabase Storage pricing at projected usage levels for image hosting. Is it viable, or should we use a separate S3 bucket?
- **R4:** Define the artifact-link suggestion strategy. Which signals matter most: prompt fingerprints, timestamps, shared uploads, copied text fragments, or manual confirmation?
- **R5:** Define the "Hot Slop" ranking algorithm. Options: Hacker News decay formula, Reddit-style time-weighted scoring, simple upvotes-per-hour.
- **R6:** Define the "Rabbit Holes" ranking algorithm. Recursive CTE for fork depth vs. materialized/cached depth column. Test performance.
- **R7:** Design the content moderation MVP. At minimum: a "report" button and a way for an admin to hide content. Decide on downvotes.
- **R8:** Decide on auth strategy. Email/password only, or add OAuth (Google, GitHub)?

---

## Tasks That Should Wait

Do not start these until the MVP (P0 + P1 + P2/P3 as needed) is shipped and validated with real users.

- A visible seed-first or graph-first journey workspace.
- AI-powered auto-tagging (strong candidate for first post-MVP feature).
- Browser extension for one-click capture.
- Stripe billing integration.
- In-platform AI generation (API calls with micro-credits).
- Embeddable artifact widgets (like GitHub Gists).
- Semantic search with embeddings.
- Mobile-native app.
- Video upload and hosting.
- Curated exhibitions / challenges / bounties.
