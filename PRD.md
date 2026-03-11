# PRD — SlopVault Product Requirements

## Problem

Generative AI has made creation nearly free. A single user can produce dozens of text outputs, images, and audio files in a day across ChatGPT, Claude, Gemini, Grok, Midjourney, Suno, and others. But there is no unified place to store, organize, retrieve, and continue that work with its provenance intact.

The current state:

- **The Silo Trap.** Text is stuck in ChatGPT conversation history. Images live in Midjourney Discord threads. Audio is in Suno. Each platform is a walled garden with no export-friendly archive.
- **The Digital Grave.** Good work gets buried in Downloads folders, chat histories, or cloud drives with no tagging, no search, and no structure.
- **The Process Leak.** The prompt, source surface, timestamps, uploads, and iterations that produced an output are often more interesting than the final output itself, but they are fragile and easy to lose.
- **The Continuity Gap.** Existing tools can generate content, but they do not help a user reliably pick up the thread of an idea across multiple models, files, and revisions.

### The Founding Use Case

In March 2026, the founder went on a 12-hour research sprint about the technological substrates of human civilization. To complete this single creative session, they used ChatGPT, Gemini, Google Keep (while driving), a Mac plaintext editor, GPT again, Grok, Gemini again, and Obsidian — 6+ applications, with manual Ctrl+A → Ctrl+V as the only integration layer between them. They described their workflow as: "There wasn't an easy way (that I know of) to share or export the raw conversations, so I Ctrl+A and then Ctrl+V'ed into plaintext editor app."

That workflow is the problem. The AI companies build amazing generators but weak archives and even weaker integrators. SlopVault is the missing capture, retrieval, and provenance layer.

## Users

### Primary: The ADHD Creator / Systems Thinker

Goes on deep research rabbit holes. Uses 3-5 AI tools in a single session. Produces volumes of output. Abandons organizing it because the friction is too high. Wants a "just dump it and go" solution that also makes retrieval possible later. The founder is this person.

### Secondary: The Online Ghost

Wants to share interesting AI output but hates the self-promotion game. No follower counts, no personal brand anxiety. Pseudonymous, concept-first sharing. Doesn't want to "build a personal brand on LinkedIn or get yelled at by traditional artists on Twitter."

### Tertiary: The Prompt Tinkerer

Wants to see the recipe behind cool outputs — the prompt, the model, the upload context, the timestamps, and the visible process that produced the thing. Wants to inspect provenance and, later, fork or remix it.

## Jobs to Be Done

1. **Capture:** Bring raw AI material into one intake surface without needing to understand the ingestion model first. This includes: copy-pasted LLM conversations, official provider export JSON/history files, standalone prompts, and standalone artifacts. Also: drag-and-drop files (images, text files) into the vault.
2. **Organize:** Tag, search, and browse a personal vault of AI-generated artifacts across models and modalities.
3. **Retrieve:** Find that one great output from three weeks ago without remembering which tool or conversation produced it.
4. **Preserve Provenance:** Keep source model, source surface, prompt where detectable, timestamps, uploads, and related-item evidence attached to artifacts so the process is not lost.
5. **Reconnect Work:** See what artifacts are likely related, confirm or correct those links, and resume work from the right context instead of starting over.
6. **Share:** Publish individual artifacts to the public side of the product without friction or identity anxiety.
7. **Bundle:** Later, group related artifacts into a coherent package for presentation or broader sharing.

## Goals

- Build the best place on the internet to paste a raw ChatGPT/Claude conversation and get a clean, saved, searchable artifact. The parser is the hero feature.
- Make the private vault genuinely useful before any social layer exists.
- Make ingestion itself a reason to adopt the product: if a user goes through the trouble of exporting provider history files, SlopVault should immediately reward that effort with structure, retrieval value, and lock-in.
- Build an artifact-first MVP on top of a hidden provenance ledger that preserves the evidence needed for later trace reconstruction.
- Ship a working MVP in 6 weeks.
- MVP supports three media types: text (with full parsing), images (JPG/PNG upload, no special parsing), and audio links (URL references to Suno/Udio, not hosted audio). Text parsing is the differentiator; image and audio are basic upload/link storage.

## MVP Ingestion Model

- There is one clear ingestion surface for everything the user brings into SlopVault.
- The user should not have to decide up front whether they are importing a seed/trace, a conversation, a prompt, or a standalone artifact.
- Supported MVP ingestion inputs:
  - copy-pasted conversations
  - official provider export JSON/history uploads
  - standalone artifact uploads or paste, including batch artifact upload up to 10 items
  - standalone prompt uploads or paste
- The product should provide exact step-by-step export guidance for supported providers from inside the ingestion experience.
- If a user is willing to go through awkward manual export steps to get high-value history into SlopVault, the import result should feel meaningfully better than leaving the data in the source product.

## Non-Goals

- SlopVault is not a generation tool. It does not call AI APIs to create content (this is a future monetization path, not an MVP feature).
- SlopVault is not a real-time collaboration tool. No Google-Docs-style co-editing.
- SlopVault is not a social network with follows, DMs, or profiles. Social features are feed-based and pseudonymous. No follower counts.
- SlopVault does not need a fully visible seed-first or graph-first UX at launch. The underlying provenance ledger can remain mostly hidden in MVP while surfacing only lightweight related-item and recipe views.
- SlopVault does not need auto-tagging at launch. Manual tags are sufficient. Auto-tagging (using a lightweight vision/text model) is a strong post-MVP feature.
- SlopVault is not a video host. Video is explicitly deferred.

## Assumptions

- A heuristic/regex parser can reliably clean raw paste from the top 4 LLMs (ChatGPT, Claude, Gemini, Grok) without requiring ML models.
- The intake flow can capture enough provenance evidence — source surface, timestamps, prompt-family hints, uploads, and manual corrections — to support later trace reconstruction without needing visible seed/trace objects in MVP.
- Supabase provides sufficient auth, database, and storage for early-stage usage.
- Pseudonymous identity (no OAuth social login) is acceptable for MVP.
- Users will paste content manually before any browser extension or API integration exists. Drag-and-drop file upload is the secondary capture method.
- Users may tolerate awkward manual export and upload steps if the ingestion payoff is high enough; this should be treated as a feature opportunity, not as unacceptable friction.
- Lightweight provenance surfaces (related items, derived-from hints, recipe metadata) are enough to prove value before a full visible journey/trace interface exists.

## The Canonical Test Case

The founder's "Civilizational Substrate Technologies" research project is the Day-1 test case. It consists of multiple artifacts from different LLMs (ChatGPT, Gemini, Grok), created across a 12-hour session and passed through notes, text editors, and a vault.

A successful MVP means this project can be:

1. Pasted into The Dumpster as raw text from each LLM session.
2. Uploaded from provider export files when the user wants higher-fidelity recovery than copy-paste alone.
3. Parsed into clean, beautiful Markdown with correct source-model attribution.
4. Saved to The Stash with tags and provenance metadata.
5. Retrieved later through search, metadata, and related-item cues rather than only by memory.
6. Manually corrected or linked when the system's provenance guesses are incomplete.
7. Shared directly as individual artifacts before any later bundling flow is required.

If the platform handles this project well, it handles the general case.

## Open Questions

- **Auth strategy.** Email/password via Supabase Auth? Add Google OAuth? Magic links?
- **Free-tier limits.** How much storage before paywall? (Brainstorm suggested 1GB free, $5-8/mo for power users.)
- **Deployment.** Vercel for Next.js hosting? Or self-hosted?
- **How visible should provenance be in MVP?** Are related-item panels and recipe metadata enough, or should a visible journey view arrive sooner?
- **Public packaging model.** Do bundles/nodes remain the main public/share object, or should public sharing later reflect the hidden provenance model more directly?
- **Content moderation.** What happens when someone publishes objectionable content to the public feed? Minimum moderation strategy for MVP?
- **Downvotes.** The brainstorm references Reddit's "brutal democratization" but only specifies upvotes. Do we add downvotes for quality control, or rely on upvotes-only plus a report button?
- **Mobile.** Responsive web only, or is a mobile-specific experience needed early?

## Initial Milestones

| Milestone | Description | Target |
|-----------|-------------|--------|
| M0 | Repo scaffolded, Next.js + Supabase initialized, parser/import prototype working on raw ChatGPT paste and provider export inputs, dark-mode theme applied, provenance metadata contract documented | Week 1-2 |
| M1 | Private vault functional: unified ingestion → parse/import → save → list → view → search → direct artifact share. Supports text parsing + source JSON/history import + image upload + audio links + related-item/provenance surfaces + manual link correction. | Week 3-4 |
| M2 | Bundling and optional sharing: group multiple artifacts into a project/package object with ordering and share metadata | Week 5-6 |
| M3 | Public feed with three modes (New/Raw, Hot Slop, Rabbit Holes), upvoting, and public package view | Week 7-8 |
| M4 | Fork mechanic and richer public lineage visualization for shared packages | Week 9-10 |
