# TECH_STACK.md

## Purpose

This is the design-facing tech stack summary for SlopVault. It translates the architecture docs into practical UI constraints.

## Stack

- Framework: Next.js App Router
- Styling: Tailwind CSS
- Database and auth: Supabase
- Storage: Supabase Storage
- Search: Postgres full-text search

## What This Means for Design

### Good Fits

- Strong app-shell routing
- Fast server-rendered page structure
- Reusable token-driven components
- Responsive layout with utility classes
- Form-heavy and metadata-heavy screens
- Dark-mode-first experience

### Avoid Early

- Heavy custom visualization frameworks for MVP
- Overbuilt charting or graph engines before journey view requirements stabilize
- Animation systems that require a separate design language
- Multiple UI libraries stitched together

## UI Constraints

- The MVP must work well as responsive web on desktop and mobile.
- The first implementation should rely on CSS, layout primitives, and a small number of shared components.
- The ingestion surface must handle raw text paste, provider export JSON upload, standalone prompt input, and standalone artifact upload without becoming four separate tools.
- Batch standalone artifact intake should support up to `10` uploaded items in one flow.
- Journey and lineage visualization should not force the entire app into a graph-product architecture.
- Prompt/result sharing must work inside standard page layouts without depending on custom rendering engines.
- Provider export guidance should be rendered as normal product UI content, not as an external documentation dependency.

## Recommended Frontend Stack Decisions

- Use Tailwind tokens backed by `DESIGN_SYSTEM.md`.
- Use CSS variables for semantic color and spacing tokens.
- Keep icons to one family.
- Use client components only where interaction requires them.
- Prefer composable primitives over one-off page-specific widgets.

## Performance Considerations

- Vault and explore lists must remain fast at 100+ artifacts.
- Artifact detail should render content first and hydrate extras later if needed.
- Journey views should scale through progressive disclosure rather than rendering every possible detail at once.

## Accessibility Considerations

- Dark mode must be designed, not inverted.
- Keyboard navigation must work on rails, filters, sheets, and inspectors.
- Mobile actions must be thumb-sized and pinned when they matter.

## Product Constraint Reminder

The stack exists to support:

1. paste and parse
2. save and retrieve
3. share directly
4. later extend into provenance, browsing, and forking

If a proposed UI requires infrastructure that delays those four jobs, it does not belong in the current MVP.
