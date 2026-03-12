# AGENTS.md — Operating Rules for SlopVault

## Mission

Build SlopVault: a web platform where AI creators can paste, parse, organize, retrieve, and optionally share their AI-generated artifacts, with a hidden provenance ledger that preserves lineage from prompt to output to later remix.

## Founder Context

The founder is an unemployed anthropologist, not a developer or business person. They have ADHD and are an "online ghost" — deeply averse to self-promotion and social media. They are not able to review code in technical detail; they evaluate by using the product. Agents should write clear, self-documenting code and never assume the founder can debug implementation issues.

## The Origin Story (Read This — It Defines Everything)

In March 2026, the founder went on a 12-hour research sprint about the technological substrates of human civilization, inspired by the book *Chip War*. To complete this single creative session, they had to bounce across:

1. ChatGPT (initial research prompt)
2. Gemini (expanding the framework)
3. Google Keep (writing notes while driving)
4. Mac plaintext editor (expanding the notes)
5. ChatGPT, Grok, and Gemini again (dropping the seed into three models in parallel)
6. Obsidian (creating a vault to organize the outputs)
7. Manual Ctrl+A → Ctrl+V into a text editor (because there was no easy way to export raw LLM conversations)

This workflow — and the absurd friction it required — is both the origin story and the canonical use case. If the product doesn't make *that specific workflow* dramatically better, it has failed.

The founder's "Civilizational Substrate Technologies" research project is the canonical test case for the platform. It should be used as seed data for testing: multiple artifacts from different LLMs, captured across the same rabbit hole, with enough metadata to preserve provenance and later reconstruct relationships.

## What to Read First

1. `01_THE_NORTH_STAR.md` — the philosophical foundation and vibe. Non-negotiable tone: utilitarian dark mode, no corporate polish, pro-chaos, pseudonymous.
2. `PRD.md` — the product requirements. This is the source of truth for what to build.
3. `SCHEMA.md` — the data model. All implementation work should conform to this unless a change is explicitly proposed and documented.
4. `ARCHITECTURE.md` — tech stack decisions and tradeoffs.
5. `BACKLOG.md` — what to do next, in priority order.
6. `GATE_CLOSEOUT.md` — the mandatory workflow for pausing, reflecting, and awaiting founder disposition at the end of every phase/gate.

## Frontend / Design Read Order

For any frontend, UX, or visual work, read these before making changes:

1. `DESIGN_SYSTEM.md` — tokens, layout rules, hierarchy, state styling, and component recipes.
2. `FRONTEND_GUIDELINES.md` — screen hierarchy, interaction rules, shell behavior, and sharing rules.
3. `APP_FLOW.md` — current route map, screen priorities, and the canonical MVP user flow.
4. `TECH_STACK.md` — design-facing technical constraints for the frontend.
5. `progress.txt` — latest design and implementation progress notes.
6. `LESSONS.md` — things we already learned and should not relearn the hard way.

## Operating Rules

1. **No speculative overbuilding.** The biggest risk is building a "platform for everything" instead of shipping a working parser + vault. Always ask: does this help a user paste raw LLM output, save a clean artifact, and retrieve it later with useful provenance?

2. **The parser is the product.** Phase 1 lives or dies on the quality of the raw-text-to-clean-Markdown parser. It must handle messy copy-paste from ChatGPT, Claude, Gemini, and Grok — including UI artifacts like "Thought for 2m 49s", model attribution lines, and inconsistent formatting. The brainstorm calls this the "God-Tier Text Parser" — that's the bar.

3. **The Mos Eisley Cantina, not a museum.** The vibe is gritty, fast, anonymous, and full of hidden gems. Dark mode is the only mode. The aesthetic is Obsidian-meets-brutalist: high information density, monospace where appropriate, no rounded-corner friendliness. We are NOT building a sterile art gallery or a Behance clone.

4. **Pseudonymous by default.** Users have pseudonyms, not real names. No follower counts to create anxiety. No profile photos in MVP. Identity is concept-first. Let the ideas speak.

5. **Lineage is a first-class citizen.** Every artifact should preserve as much provenance as we can reliably capture: source model, source surface, prompt (if available), timestamps, uploads, prompt-family evidence, and any manual corrections or derived links. This metadata is not optional decoration — it is core product. The prompt, the mistakes, and the 15 variations are as important as the final output.

6. **Ship the single-player game first.** The vault (private storage + retrieval) must work perfectly before any social features (bundling, feed, forking, upvotes) are built. A user who never publishes anything should still love the product.

7. **Three capture methods.** The primary input is Ctrl+A → Ctrl+V paste from an LLM chat window. But the platform should also support drag-and-drop file upload (images, text files) and manual text entry. Paste is the priority; the others come after.

8. **Provenance before feed.** The public feed still matters, and the three feed modes remain part of the longer-term product direction. But early-stage differentiation comes from provenance-aware capture and retrieval, not from social mechanics. Do not build the feed before the parser, vault, metadata capture, related-item surfaces, and manual correction flows are working.

9. **Respect the concept docs and the test corpus.** The files in `01_*`, `02_*`, and `03_*` are archival. Preserve them as-is. The repo-root folder `dump/` is an active ingestion test corpus and holding area (provider buckets and export-method experiments). Preserve raw files exactly when possible; add sidecar notes/manifests instead of editing source data.

## Corpus Steward

This repo treats corpus hygiene as production work. A parser is only as good as the samples it is tested against.

Rules:

1. Do not commit private exports or PII. Use `dump/_private/` or `dump/_local/` (both gitignored) for anything sensitive or WIP.
2. Keep committed samples in provider buckets (`dump/openai-dump/`, `dump/google-dump/`, etc.) and preserve raw files when possible.
3. Prefer sidecars over edits. Use `MANIFEST-{filename}.md` for per-sample notes. Use `MANIFEST.md` only for directory-level inventories.
4. Canonical repo-root seed files live outside `dump/`:
   `GPT-original-seed.txt` and `gemini-2.txt`.
5. If you add a new export method, document it in the provider README and add at least one reduced fixture under `tests/fixtures/` when it’s stable enough.

## What Is Real vs. Assumed

### Real (grounded in the concept docs)

- The problem: AI output is scattered across siloed platforms with no unified archive. The founder's 12-hour, 6-app sprint is the proof.
- The target user: ADHD creators / online ghosts who use multiple AI tools and lose track of output.
- The core loop: paste raw text → auto-parse → save to private vault → retrieve later with provenance → optionally bundle/share.
- The vibe: Mos Eisley Cantina, not a museum. Utilitarian dark mode, chaotic, pseudonymous.
- Tech stack direction: Next.js + Tailwind + Supabase.
- Monetization direction: freemium storage tiers ($8/mo for media-heavy vaults).
- The Substrate project is the canonical test case and initial seed data.
- MVP supports text (primary), images (JPG/PNG), and audio links. Text parsing is the hero feature; image/audio are upload-only with no special parsing.
- The public layer still includes three feed modes: "New/Raw", "Hot Slop", and "Rabbit Holes", but those are later-phase features, not the center of the initial MVP.

### Assumed (reasonable inferences, not yet validated)

- That a regex/heuristic parser can reliably clean output from the top 4 LLMs without ML.
- That the parser and intake flow can also capture enough provenance signals to support later trace reconstruction without immediately introducing a seed-first schema.
- That Supabase storage is sufficient for media at the scale of early users.
- That pseudonymous identity is enough for social features (no OAuth social login needed for MVP).
- That the "fork" mechanic and "Rabbit Holes" feed may drive growth later, but do not need to prove the MVP's core value.
- That auto-tagging can be deferred to post-MVP. The brainstorm mentions lightweight auto-tagging (#cyberpunk, #essay), but this likely requires an ML model and adds complexity. Manual tags first; auto-tagging is a strong Phase 2+ feature.

### Undecided (needs founder input)

- Exact free-tier storage limits (1GB was mentioned in the brainstorm).
- Domain name and deployment target (Vercel assumed but not confirmed).
- Auth strategy: Supabase Auth with email/password, or add OAuth providers.
- How much of the hidden provenance ledger should be visible in the first MVP UI beyond related-item hints and metadata panels.
- Downvote mechanic: Reddit uses downvotes for quality control. Do we add downvotes, or just upvotes? The brainstorm mentions "brutal democratization" but only specifies upvotes in the MVP spec.

## Gate Closeout

Every roadmap phase (gate) requires a closeout pass before it can be marked complete. See `GATE_CLOSEOUT.md` for full details. 

Required sequence:
1. validate the gate output,
2. pause and reflect,
3. file a reflection artifact,
4. implement feasible in-scope reflection suggestions or explicitly defer them,
5. update durable docs if the reflection changes standing guidance,
6. update the roadmap status,
7. deliver the end-of-gate report and wait for user disposition.

Do not commit or push automatically at gate closeout. The standard user dispositions after a gate report are:
- make changes
- roll back specified changes
- commit and proceed

## Definition of Done for Early-Stage Work

A piece of work is "done" when:

1. It has working code that can be demonstrated (not just planned).
2. It conforms to the schema in `SCHEMA.md` or explicitly proposes a schema change.
3. It does not introduce dependencies or features not justified by `BACKLOG.md` P0/P1.
4. It looks right in dark mode. If it doesn't look right in dark mode, it is not done.
5. It has been tested with at least one real raw-paste from ChatGPT and one from Claude, including validation that the parser or intake layer preserves useful provenance metadata.
