# PRD — SlopVault Product Requirements

## Problem

Generative AI has made creation nearly free. A single user can produce dozens of text outputs, images, and audio files in a day across ChatGPT, Claude, Gemini, Grok, Midjourney, Suno, and others. But there is no unified place to store, organize, retrieve, or share that output.

The current state:

- **The Silo Trap.** Text is stuck in ChatGPT conversation history. Images live in Midjourney Discord threads. Audio is in Suno. Each platform is a walled garden with no export-friendly archive.
- **The Digital Grave.** Good work gets buried in Downloads folders, chat histories, or cloud drives with no tagging, no search, and no structure.
- **The Sharing Gap.** Existing social platforms (X, Reddit, Instagram) are feed-first and ephemeral. GitHub is code-specific. There is no "Git for AI creatives" — no platform designed for archiving, lineage tracking, and remixing AI-generated artifacts.
- **Lost Process.** The prompt, model, seed, iterations, and variations are often more interesting than the final output, but they get discarded. Lineage is not preserved.

## Users

### Primary: The ADHD Creator / Systems Thinker

Goes on deep research rabbit holes. Uses 3-5 AI tools in a single session. Produces volumes of output. Abandons organizing it because the friction is too high. Wants a "just paste it and forget about it" solution that also makes retrieval possible later.

### Secondary: The Online Ghost

Wants to share interesting AI output but hates the self-promotion game. No follower counts, no personal brand anxiety. Pseudonymous, concept-first sharing.

### Tertiary: The Prompt Tinkerer

Wants to see the recipe behind cool outputs — the prompt, the model, the seed. Wants to fork and remix other people's work.

## Jobs to Be Done

1. **Capture:** Paste raw, ugly LLM output from any source and have it automatically cleaned, formatted, and saved.
2. **Organize:** Tag, search, and browse a personal vault of AI-generated artifacts across models and modalities.
3. **Retrieve:** Find that one great output from three weeks ago without remembering which tool or conversation produced it.
4. **Bundle:** Group related artifacts (a text output + an image + a prompt chain) into a single coherent "Node" that represents a project or idea.
5. **Share:** Publish nodes to a public feed without friction or identity anxiety.
6. **Remix:** Fork someone else's published node, modify it, and republish — creating a visible lineage tree.

## Goals

- Build the best place on the internet to paste a raw ChatGPT/Claude conversation and get a clean, saved, searchable artifact.
- Prove single-player value (private vault) before social value (public feed).
- Ship a working MVP in 4-6 weeks.
- Support text artifacts at launch. Image and audio support are Phase 2.

## Non-Goals

- SlopVault is not a generation tool. It does not call AI APIs to create content (this is a future monetization path, not an MVP feature).
- SlopVault is not a real-time collaboration tool. No Google-Docs-style co-editing.
- SlopVault is not a social network with follows, DMs, or profiles. Social features are feed-based and pseudonymous.
- SlopVault does not need to support every file format at launch.

## Assumptions

- A heuristic/regex parser can reliably clean raw paste from the top 4 LLMs (ChatGPT, Claude, Gemini, Grok) without requiring ML models.
- Text-first MVP is the right wedge. The pain of lost text output is higher-frequency than lost images.
- Supabase provides sufficient auth, database, and storage for early-stage usage.
- Pseudonymous identity (no OAuth social login) is acceptable for MVP.
- Users will paste content manually before any browser extension or API integration exists.

## Open Questions

- **Image support timeline.** Should MVP support image uploads alongside text, or is text-only cleaner for launch?
- **Auth strategy.** Email/password via Supabase Auth? Add Google OAuth? Magic links?
- **Free-tier limits.** How much storage before paywall? (Current thinking: generous for text, paid for media.)
- **Parser scope.** How many LLM output formats need to be handled at launch? Just ChatGPT and Claude, or also Gemini and Grok?
- **Deployment.** Vercel for Next.js hosting? Or self-hosted?
- **Content moderation.** What happens when someone publishes objectionable content to the public feed? Minimum moderation strategy for MVP?
- **Mobile.** Responsive web only, or is a mobile-specific experience needed early?

## Initial Milestones

| Milestone | Description | Target |
|-----------|-------------|--------|
| M0 | Repo scaffolded, Next.js + Supabase initialized, parser prototype working on raw ChatGPT paste | Week 1-2 |
| M1 | Private vault functional: paste → parse → save → list → view → search | Week 3-4 |
| M2 | Node bundling: group multiple artifacts into a project node | Week 5-6 |
| M3 | Public feed: publish nodes, browse "New" and "Hot", upvote | Week 7-8 |
| M4 | Fork mechanic: copy a node, modify, republish as child | Week 9-10 |
