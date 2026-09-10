# FRONTEND_GUIDELINES.md

## Purpose

This document turns the product direction into frontend rules. It defines what the user sees first, what stays secondary, and how the UI should behave across screens.

## MVP Product Architecture

The MVP is not a feed product. It is a personal vault with seamless sharing.

Primary jobs:

1. dump something in fast
2. find it again later
3. share it without ceremony
4. browse what others shared once your own vault already feels useful

This means:

- `Dump` and `Vault` are primary navigation
- direct artifact sharing is MVP
- `Seed` and `Journey` are provenance extensions
- `Explore` exists, but it should not dominate the signed-in experience
- all ingestion types flow through one hub

## Canonical Navigation

### Signed-In Primary Navigation

1. `Dump`
2. `Vault`
3. `Shared`
4. `Explore`

### Signed-In Secondary Navigation

- Recent
- Unresolved
- Tags
- Private
- Public

### Advanced Navigation

- Seed detail
- Journey view

Advanced navigation should open from artifact provenance, related-item clusters, or explicit lineage entry points. It should not be the first thing a new user must understand.

## Global Hierarchy Rules

- Every screen gets one dominant action.
- On signed-in screens, that dominant action is usually `Paste`, `Upload`, `Save`, or `Share`.
- `Share` is important, but it is contextual. It should never visually compete with `Parse` or `Save` during intake.
- Public browsing is secondary to personal continuity.

## MVP Share Rules

- The first shareable unit is the artifact.
- A text artifact share should present prompt and result together when prompt data exists.
- An image artifact share should present the asset, caption, and provenance summary.
- An audio link share should present the linked media, summary, and provenance summary.
- Collections and nodes can come later; they should not block direct sharing.

## Shell Behavior

### Desktop

- Left rail is persistent.
- Center region is the primary work area.
- Right inspector is present only when metadata or linked context matters.
- Bottom action bar is reserved for high-value actions on deep work surfaces.

### Mobile

- Top bar handles navigation and search entry.
- Left rail becomes a drawer.
- Right inspector becomes a slide-up sheet.
- Bottom action bar stays pinned for `Parse`, `Save`, `Share`, or `Confirm`.

## Page Rules

### Home

Signed-in home is a vault home, not a public feed.

Order of content:

1. quick capture
2. recent artifacts
3. unresolved items
4. things you shared
5. things worth exploring

If the user is logged out, public explore can lead.

### Dump

- The raw input surface is the visual hero.
- Support paste, drop, file select, and manual entry from one surface.
- Support:
  - copy-pasted conversations
  - official provider export JSON uploads
  - standalone artifact upload or paste
  - standalone prompt upload or paste
  - batch standalone artifact upload up to `10`
- Parsing result and metadata should appear as a clear second step.
- The screen should feel forgiving, oversized, and low-friction.
- The user should not need to choose the internal ingestion model before starting.
- Provider-specific "How do I export my JSON?" guidance must live on this page, reachable in one click.

### Vault

- Search and filtering come before the list.
- Cards or rows must optimize for scanning and refinding.
- Visual density is good if the hierarchy remains clear.

### Artifact Detail

- Content first, provenance second.
- Sharing is immediate from this screen.
- Related artifacts and lineage cues live in the inspector or lower secondary sections.

### Shared

- This is the user's public shelf.
- Show what is already public, what is draft-public-ready, and what is private.
- Emphasize ownership and control, not social metrics.

### Explore

- Explore is browseable and useful, but it should not look like the app's reason for existing.
- Cards should emphasize the artifact, the prompt/result idea, and lightweight provenance.
- Follow counts, avatars, and creator vanity are out.

### Seed Detail

- Seed pages are for users who want continuity across artifacts.
- Start with the current state of the idea.
- Do not bury the user in a graph before they see the current revision, linked artifacts, and next actions.

### Journey

- Journey is for reconstruction, comparison, and correction.
- It is an advanced surface.
- It must explain inference with evidence, not just draw lines.

## Component Rules

### Buttons

- One filled accent button per screen region.
- Secondary buttons are outline or quiet.
- Destructive actions require stronger confirmation styling.

### Forms

- Labels stay visible; do not rely on placeholder-only forms.
- For dense forms, group by task: source, content, tags, visibility.

### Cards

- Cards do not invent their own spacing systems.
- Each card should have a title, one preview region, one metadata row, and optional actions.

### Inspectors

- Inspectors contain metadata, provenance, related items, and actions tied to the selected object.
- Avoid duplicating primary content in the inspector.

### Badges

- Use consistent badge shape and typography everywhere.
- Do not mix uppercase, sentence case, and title case badge styles.

## Prompt and Output Presentation

For text artifacts:

- If prompt is known, show it as an input block before the result.
- Prompt should be visually distinct but lighter than the result.
- The result is the main content.
- Provenance badges should sit near the prompt/result header, not buried in the footer.

This lets users share what they asked and what they got without needing a separate "recipe" mode.

## Ingestion Guidance Rules

- Export guidance belongs inside the ingestion hub, not in a separate documentation maze.
- Guidance must be provider-specific and step-by-step.
- The user should be able to open the guide before importing, during import, or after a failed import attempt.
- Guidance should explain the exact file the product wants when that is known.
- When the user uploads or pastes something ambiguous, the UI should classify it for them and explain what will happen next.

## Provenance Presentation Rules

- Provenance is valuable, but it is secondary until the user seeks it.
- Show the most useful provenance first:
  - model
  - source surface
  - created date
  - related items
  - confidence or inferred status when relevant
- Hide dense hashes and internals behind disclosure or inspector sections.

## Empty, Loading, and Error Rules

### Empty

- Empty vault: point to Dump
- Empty shared shelf: point to Share from an artifact
- Empty unresolved queue: state that everything is placed and stop there

### Loading

- Use skeletons shaped like the final layout
- Avoid full-page spinners on known layouts

### Error

- Keep error language direct and non-technical
- Always include the next useful action

## Accessibility Rules

- Keyboard flow must follow visual flow
- Focus states must be obvious on dark surfaces
- Do not rely on hover for essential actions
- Every drawer, sheet, and modal must be escapable and labeled

## Motion Rules

- Motion supports orientation, not delight theater
- Good uses:
  - parse result appearing
  - drawer opening
  - inspector changing selection
  - selected lineage item focusing
- Avoid:
  - floaty idle movement
  - animated counters
  - decorative fades on every card

## Implementation Constraints

- Build from design tokens only
- One shared shell component
- One badge system
- One card system
- One icon family
- Seed and journey views must reuse the same token system as vault and artifact detail, not invent a separate visual language
