# AGENTS.md — Operating Rules for SlopVault

## Mission

Build SlopVault: a web platform where AI creators can paste, parse, organize, and share their AI-generated artifacts — with full lineage tracking from prompt to output to remix.

The founder's direct experience of copy-pasting raw LLM output across 6 platforms during a single research session is both the origin story and the canonical use case. If the product doesn't make *that specific workflow* dramatically better, it has failed.

## What to Read First

1. `01_THE_NORTH_STAR.md` — the philosophical foundation and vibe. Non-negotiable tone: utilitarian dark mode, no corporate polish, pro-chaos, pseudonymous.
2. `PRD.md` — the product requirements. This is the source of truth for what to build.
3. `SCHEMA.md` — the data model. All implementation work should conform to this unless a change is explicitly proposed and documented.
4. `ARCHITECTURE.md` — tech stack decisions and tradeoffs.
5. `BACKLOG.md` — what to do next, in priority order.

## Operating Rules

1. **No speculative overbuilding.** The biggest risk is building a "platform for everything" instead of shipping a working parser + vault. Always ask: does this help a user paste raw ChatGPT output and get a clean, saved, retrievable artifact?

2. **The parser is the product.** Phase 1 lives or dies on the quality of the raw-text-to-clean-Markdown parser. It must handle messy copy-paste from ChatGPT, Claude, Gemini, and Grok — including UI artifacts like "Thought for 2m 49s", model attribution lines, and inconsistent formatting.

3. **Dark mode is not a theme toggle.** It is the only mode. The aesthetic is Obsidian-meets-brutalist: high information density, monospace where appropriate, no rounded-corner friendliness.

4. **Pseudonymous by default.** Users have pseudonyms, not real names. There are no profile photos in MVP. Identity is concept-first.

5. **Lineage is a first-class citizen.** Every artifact should track: source model, prompt (if available), parent artifact (if forked), creation timestamp. This metadata is not optional decoration — it is core product.

6. **Ship the single-player game first.** The vault (private storage + retrieval) must work perfectly before any social features (feed, forking, upvotes) are built. A user who never publishes anything should still love the product.

7. **Respect the existing concept docs.** The files in `01_*`, `02_*`, `03_*` and `dump/` are archival. Do not modify them. They represent the founder's original thinking and should be preserved as-is.

## What Is Real vs. Assumed

### Real (grounded in the concept docs)

- The problem: AI output is scattered across siloed platforms with no unified archive.
- The target user: ADHD-style creators who use multiple AI tools and lose track of output.
- The core loop: paste raw text → auto-parse → save to private vault → optionally publish.
- Tech stack direction: Next.js + Tailwind + Supabase.
- Monetization direction: freemium storage tiers.

### Assumed (reasonable inferences, not yet validated)

- That a regex/heuristic parser can reliably clean output from the major LLMs without ML.
- That Supabase storage is sufficient for media at the scale of early users.
- That pseudonymous identity is enough for social features (no OAuth social login needed for MVP).
- That the "fork" mechanic will drive organic growth.
- That text-first MVP is the right wedge (vs. image-first).

### Undecided (needs founder input)

- Exact free-tier storage limits.
- Domain name and deployment target (Vercel assumed but not confirmed).
- Whether the original "Civilizational Substrate Technologies" research content becomes sample seed data for the platform.
- Auth strategy: Supabase Auth with email/password, or add OAuth providers.

## Definition of Done for Early-Stage Work

A piece of work is "done" when:

1. It has working code that can be demonstrated (not just planned).
2. It conforms to the schema in `SCHEMA.md` or explicitly proposes a schema change.
3. It does not introduce dependencies or features not justified by `BACKLOG.md` P0/P1.
4. It looks right in dark mode. If it doesn't look right in dark mode, it is not done.
5. It has been tested with at least one real raw-paste from ChatGPT and one from Claude.
