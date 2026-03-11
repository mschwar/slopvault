# BACKLOG.md — SlopVault Prioritized Task List

## P0 — Must happen first, blocks everything else

### P0-1: Initialize Next.js project
Create a Next.js 14+ app with App Router inside `src/`. Configure Tailwind with a dark-mode-only theme (no light mode toggle). Set up the base layout with a minimal nav shell. Confirm `npm run dev` works.

### P0-2: Set up Supabase project and schema
Create a Supabase project. Write and apply SQL migrations for the initial schema (`users` profile extension, `artifacts`, `nodes`, `node_artifacts` — see `SCHEMA.md`). Configure Row Level Security policies so users can only read/write their own private data. Set up the Supabase client in `src/lib/supabase.ts`.

### P0-3: Build the parser
Implement the raw-text parser in `src/lib/parser.ts`. It must:
- Accept a raw string (copy-pasted LLM output).
- Detect the likely source model from UI artifacts.
- Strip non-content elements (thinking indicators, copy-button text, model labels).
- Separate prompt from response where detectable.
- Output clean Markdown + a metadata object `{ source_model, detected_prompt, raw_length, parsed_length }`.
- Handle at minimum: ChatGPT (including o-series "Thought for..." preambles) and Claude output.

### P0-4: Write parser test cases
Collect 8-10 real raw pastes from ChatGPT, Claude, Gemini, and Grok. Write unit tests that verify the parser produces clean output and correct metadata for each. These test cases are critical — they define product quality.

### P0-5: Build auth flow
Implement sign-up and sign-in pages using Supabase Auth (email/password). Create a `profiles` table row on sign-up with a user-chosen pseudonym. Protect vault routes with auth middleware.

---

## P1 — Core MVP features, build after P0 is solid

### P1-1: Build The Dumpster page
A full-screen textarea with a "Parse" button. On submit, call the parser and show a preview of the cleaned Markdown alongside extracted metadata. "Save to Stash" button persists the artifact. Allow the user to add tags before saving.

### P1-2: Build The Stash page
Grid or list view of all artifacts belonging to the authenticated user. Each card shows: title (auto-generated from first heading or first line), snippet, source model badge, tags, creation date. Clicking a card opens the artifact detail view.

### P1-3: Build artifact detail view
Full rendered Markdown display. Sidebar or header showing metadata: source model, detected prompt, tags, creation date, raw vs. parsed character counts. Edit button for tags and title.

### P1-4: Implement search
Add full-text search using Postgres `tsvector` across artifact `parsed_markdown` and `tags`. Search bar in the Stash page header. Results update as the user types (debounced).

### P1-5: Implement artifact visibility toggle
On individual artifacts, add a Private/Public toggle. Public artifacts are readable without auth via a shareable URL.

---

## P2 — Nodes, bundling, and social layer. Build only after P1 is working and tested.

### P2-1: Build Node creation flow
"New Node" button in the Stash. Multi-select artifacts, give the node a title and optional description, save. Node detail page shows bundled artifacts in sequence. Nodes have their own Private/Public visibility toggle.

### P2-2: Build the public feed page
Masonry-style card layout of all public Nodes. Two sort modes: "New" (chronological) and "Hot" (upvotes weighted by recency). Paginated or infinite scroll.

### P2-3: Implement upvoting
Authenticated users can upvote public Nodes. One upvote per user per Node. Upvote count displayed on Node cards and detail pages.

### P2-4: Build user profile page
Public page at `/u/{pseudonym}` showing the user's published Nodes. Minimal — pseudonym, join date, list of public Nodes.

### P2-5: Implement the fork mechanic
"Fork" button on public Nodes. Creates a copy in the forking user's Stash with `parent_node_id` set. The forked Node can be edited and republished. Parent and child Nodes display their lineage relationship.

### P2-6: Lineage tree visualization
On any Node with forks, show a simple tree or breadcrumb of the fork chain. Depth-limited to prevent performance issues on deep chains.

---

## Research / Clarification Tasks

These are not implementation tasks. They require investigation or founder decisions.

- **R1:** Test the parser against 20+ real pastes to identify failure modes. Document which LLM output formats are hardest to parse.
- **R2:** Decide on image support timeline. If Phase 1 includes images, the parser and storage architecture need to change.
- **R3:** Evaluate Supabase storage pricing at projected usage levels. Is it viable for media, or should we use a separate S3 bucket?
- **R4:** Define the "Hot" ranking algorithm. Options: Hacker News decay formula, Reddit-style time-weighted scoring, simple upvotes-per-hour.
- **R5:** Design the content moderation MVP. At minimum: a "report" button and a way for an admin to hide content.

---

## Tasks That Should Wait

Do not start these until the MVP (P0 + P1 + P2) is shipped and validated with real users.

- Browser extension for one-click capture.
- AI-powered auto-tagging.
- Stripe billing integration.
- In-platform AI generation (API calls).
- Embeddable artifact widgets.
- Semantic search with embeddings.
- Mobile-native app.
