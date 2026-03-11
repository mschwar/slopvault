# ROADMAP.md — SlopVault Phased Execution Plan

## Phase 0: Clarify and Stabilize Concept (Week 0-1)

**Goal:** Turn the concept workspace into a buildable project.

- Finalize tech stack decisions (this phase is largely complete with the scaffolding docs).
- Resolve open questions: auth strategy, image support at MVP, deployment target.
- Initialize the Next.js project with Supabase client configured.
- Set up Tailwind with the dark-mode-only theme.
- Create the Supabase project and apply initial schema migrations.
- Build and test the parser against real raw pastes from ChatGPT and Claude.

**Exit criteria:**
- `npm run dev` starts a working Next.js app with Supabase connected.
- The parser function accepts raw ChatGPT paste and returns clean Markdown + metadata.
- At least 5 real raw-paste test cases exist and pass.
- Dark mode base theme is applied globally.

---

## Phase 1: The Single-Player Game (Weeks 2-4)

**Goal:** Build a private vault that is genuinely useful for one person who generates a lot of AI text.

Features:

- **The Dumpster:** A paste-and-parse page. Large textarea, submit button, preview of parsed output, save button.
- **The Stash:** A list/grid view of all saved artifacts. Title, preview snippet, source model badge, tags, date.
- **Artifact detail view:** Full rendered Markdown with metadata sidebar (source model, prompt if detected, creation date, tags).
- **Search:** Full-text search across artifact content and tags.
- **Tags:** Manual tag input on save. Tag-based filtering in the Stash.
- **Auth:** Sign up / sign in with email and password. Protected routes.

**Exit criteria:**
- A new user can sign up, paste raw LLM output, see it parsed, save it, find it later via search or tags.
- The Stash loads and renders 100+ artifacts without performance issues.
- All views are dark mode, responsive to mobile widths.
- The parser handles ChatGPT, Claude, Gemini, and Grok raw pastes.

---

## Phase 2: Nodes and Bundling (Weeks 5-6)

**Goal:** Let users group related artifacts into project-like bundles.

Features:

- **Create Node:** Select multiple artifacts from the Stash, give the bundle a title and description, save as a Node.
- **Node detail view:** Shows all bundled artifacts in order with the node's metadata.
- **Node management:** Edit node title/description, add/remove artifacts, reorder.
- **Visibility toggle:** Nodes can be marked Private or Public.

**Exit criteria:**
- A user can create a Node from 3+ artifacts, view it as a coherent page, and toggle it to Public.
- Nodes appear in the Stash alongside standalone artifacts (or in a separate "Nodes" tab).

---

## Phase 3: The Public Feed (Weeks 7-8)

**Goal:** Let users discover and engage with published content.

Features:

- **Public feed page:** Masonry or card layout of published Nodes. Sorted by "New" and "Hot" (upvote-based ranking).
- **Upvoting:** Authenticated users can upvote published Nodes.
- **Public Node view:** Viewable by anyone (no auth required to read).
- **User profile page:** Pseudonym, list of published Nodes.

**Exit criteria:**
- A visitor (not logged in) can browse the public feed and read published Nodes.
- A logged-in user can upvote Nodes.
- "Hot" sorting produces a reasonable ranking based on upvotes and recency.

---

## Phase 4: Fork and Lineage (Weeks 9-10)

**Goal:** Enable the remix/fork mechanic that differentiates SlopVault.

Features:

- **Fork button:** On any public Node, a logged-in user can fork it into their own Stash as a new Node with `parent_node_id` set.
- **Lineage display:** On a Node's detail page, show its parent (if forked) and any children (forks of it).
- **Lineage tree visualization:** Simple tree or breadcrumb showing the fork chain.

**Exit criteria:**
- User A publishes a Node. User B forks it, modifies it, publishes the fork. Both Nodes show the parent-child relationship.
- The lineage chain is visible on both the parent and child Node pages.

---

## Later Phases (Post-MVP)

These are documented for future direction but should not be built or scaffolded now.

- **Image and media upload support** with Supabase Storage.
- **AI-powered auto-tagging** using an LLM or embedding model.
- **Browser extension** for one-click capture from LLM chat interfaces.
- **API integrations** with ChatGPT, Claude, etc. for direct import.
- **Freemium billing** with Stripe for premium storage tiers.
- **In-platform generation** via LLM API calls (micro-credit model).
- **Curated exhibitions / challenges** (community events).
- **Embeddable artifacts** (like GitHub Gists).
- **Full-text semantic search** using embeddings.
