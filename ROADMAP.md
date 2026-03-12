# ROADMAP.md — SlopVault Phased Execution Plan

## Phase 0: Clarify and Stabilize (COMPLETE → Gate 1 Done)

**Status:** Gate 1 complete. The canonical ingestion path is wired: `/dump` → `/api/ingestions` → `/vault`.

**What exists:**
- Next.js 14+ app with App Router in `src/`
- Styling is currently plain CSS (`src/app/globals.css`), not Tailwind (Tailwind remains a target-state option)
- Local ingestion service (`src/lib/ingestions/service.ts`) using JSON file store
- `/dump` route: The Dumpster ingestion UI (paste + drop files, preview, commit)
- `/vault` route: reads committed artifacts from local store
- `/api/ingestions/*` endpoints: create → analyze → commit flow
- Parser tested against provider fixtures plus substrate corpus smoke samples in `dump/` (see `tests/substrate.test.ts`)
- Provenance is partial: provider/surface + prompt fingerprints exist; timestamps/model attribution are still incomplete
- 20 unit tests passing

**Naming note:** `/dump` (UI route) vs `dump/` (repo corpus directory) — be aware of this collision.

**Exit criteria:** ✅ Canonical ingest loop and local store wiring are met (Gate 1). Supabase connection and the full provenance contract are deferred (Gate 2+).

---

## Phase 1: The Single-Player Game (Weeks 2-4)

**Goal:** Build a private vault that is genuinely useful for one person who generates a lot of AI content. The founder should be able to dump their entire Substrate research project into the vault, retrieve it later, and understand what is related to what.

Features:

- **The Dumpster (unified ingestion hub):** One clear intake surface for copy-pasted conversations, provider export JSON/history uploads, standalone prompts, standalone artifacts, JPG/PNG uploads, and audio links. The user should not need to understand the ingestion model first.
- **Export guidance:** Exact step-by-step provider export instructions available inside The Dumpster for supported sources.
- **The Stash:** A list/grid view of all saved artifacts. Each card shows: title, preview snippet (or thumbnail for images), source model badge, tags, creation date. Filtering by type (text/image/audio).
- **Artifact detail view:** Full rendered Markdown for text. Image display for images. Link embed for audio. Metadata sidebar (source model, prompt if detected, source surface, timestamps, tags).
- **Direct artifact sharing:** Artifacts can be made public directly from their detail pages with a clean public URL and prompt/result presentation when available.
- **Related-item surfaces:** Best-effort related artifacts, same-prompt-family hints, and derived-from cues built from the hidden provenance ledger.
- **Manual correction:** Confirm, dismiss, or add links when the system's artifact relationship guesses are wrong or incomplete.
- **Search:** Full-text search across artifact content and tags.
- **Tags:** Manual tag input on save. Tag-based filtering in the Stash.
- **Auth:** Sign up / sign in with email and password. Pseudonym chosen at sign-up. Protected routes.

**Exit criteria:**
- A new user can sign up, paste raw LLM output, see it parsed, save it, and find it later via search, tags, or provenance cues.
- A user can upload a provider export file, preview the import result, and save it.
- A user can drag-and-drop an image or batch import standalone artifacts and save them to the Stash.
- Artifact detail views show useful metadata and related-item suggestions.
- A user can make an individual artifact public directly from its detail view.
- A user can manually confirm or dismiss inferred links between artifacts.
- The Stash loads and renders 100+ artifacts without performance issues.
- All views are dark mode and responsive to mobile widths.
- The parser handles ChatGPT, Claude, Gemini, and Grok raw pastes.
- The founder's Substrate project can be fully imported as a provenance-aware private vault test.

---

## Phase 2: Bundling and Optional Sharing (Weeks 5-6)

**Goal:** Let users package related artifacts into a presentation-ready object without changing the artifact-first storage model underneath.

Features:

- **Create Node:** Select multiple artifacts from the Stash (text + images + audio links together), give the bundle a title, description, and a hook, and save it as a Node/package.
- **Node detail view:** Shows bundled artifacts in order with the Node's metadata. Mixed media — text and images interleaved.
- **Node management:** Edit node title/description/hook, add/remove artifacts, reorder.
- **Visibility toggle:** Nodes can be marked Private or Public.

**Exit criteria:**
- A user can create a Node from 3+ artifacts of mixed types and view it as a coherent page.
- The Substrate project can be represented as a shareable package built from already-saved artifacts.
- Node creation feels like packaging or publishing work that already lives in the vault, not like the primary way the vault stores things.

---

## Phase 3: The Public Feed (Weeks 7-8)

**Goal:** Let users discover and engage with published content after the private vault and provenance-aware artifact workflows are already solid.

Features:

- **Public feed page:** Masonry or card layout of published Nodes. Three sort modes:
  - **"New/Raw"** — chronological firehose of everything published.
  - **"Hot Slop"** — upvote-weighted ranking with time decay.
  - **"Rabbit Holes"** — sorted by fork-chain depth. Surfaces the most remixed/branched content.
- **Upvoting:** Authenticated users can upvote published Nodes.
- **Public Node view:** Viewable by anyone (no auth required to read). Shows "View Recipe" metadata.
- **User profile page:** Pseudonym, join date, list of published Nodes. No follower counts.

**Exit criteria:**
- A visitor (not logged in) can browse the public feed in all three modes and read published Nodes.
- A logged-in user can upvote Nodes.
- "Hot Slop" sorting produces a reasonable ranking based on upvotes and recency.
- "Rabbit Holes" correctly surfaces nodes with the deepest fork chains.

---

## Phase 4: Fork and Public Lineage (Weeks 9-10)

**Goal:** Enable the remix/fork mechanic on the public side of the product.

Features:

- **Fork button:** On any public Node, a logged-in user can fork it into their own Stash as a new Node with `parent_node_id` set.
- **Lineage display:** On a Node's detail page, show its parent (if forked) and any children (forks of it).
- **Lineage tree visualization:** Visual tree or branching diagram showing the public fork chain.

**Exit criteria:**
- User A publishes a Node. User B forks it, modifies it, and publishes the fork. Both Nodes show the parent-child relationship.
- The lineage chain is visible on both the parent and child Node pages.
- The "Rabbit Holes" feed mode correctly uses fork depth to rank content.

---

## Later Phases (Post-MVP)

These are documented for future direction but should not be built or scaffolded now.

- **Visible seed/journey workspace** built on top of the hidden provenance ledger.
- **AI-powered auto-tagging** using a lightweight vision/text model (#cyberpunk, #synthwave, #essay).
- **Browser extension** for one-click capture from LLM chat interfaces.
- **API integrations** with ChatGPT, Claude, etc. for direct import.
- **Freemium billing** with Stripe for premium storage tiers ($8/mo for media-heavy vaults).
- **In-platform generation** via LLM API calls (micro-credit model).
- **Curated exhibitions / challenges / bounties** (community events, brand partnerships).
- **Embeddable artifacts** (like GitHub Gists).
- **Full-text semantic search** using embeddings.
- **Video support** (upload + hosting, requires significant infrastructure).
- **Downvotes** for quality control (pending decision on moderation strategy).
