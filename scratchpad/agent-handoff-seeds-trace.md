# Agent Handoff: Seeds, Trace, Fruits, and Layout

## Objective

Take the current scratchpad thinking around `seeds`, lineage tracing, `fruits` / artifacts, and the seed-centered UI, and turn it into a tighter product/interaction spec that is still exploratory but concrete enough to guide future implementation decisions.

This is not an implementation task. Do not build app code. Do not change the canonical repo docs yet. Work inside `scratchpad/` only.

## Repo Context

This repo is still a concept/spec workspace. The canonical product docs are:

- `/Users/mschwar/Documents/slopvault/AGENTS.md`
- `/Users/mschwar/Documents/slopvault/PRD.md`
- `/Users/mschwar/Documents/slopvault/SCHEMA.md`
- `/Users/mschwar/Documents/slopvault/ARCHITECTURE.md`
- `/Users/mschwar/Documents/slopvault/BACKLOG.md`

Important constraints from those docs:

- The parser is the product.
- The private vault comes before the public/social layer.
- Lineage is first-class.
- Do not modify archival concept docs (`01_*`, `02_*`, `03_*`, `dump/`).
- For this task, keep work inside `scratchpad/`.

## Source Material To Read First

Read these scratchpad materials before doing anything else:

- `/Users/mschwar/Documents/slopvault/scratchpad/scratchpad.md`
- `/Users/mschwar/Documents/slopvault/scratchpad/path.jpg`
- `/Users/mschwar/Documents/slopvault/scratchpad/fruits-seeds.jpg`
- `/Users/mschwar/Documents/slopvault/scratchpad/feed.jpg`

## Current Working Model

The current direction is:

- A `seed` is the long-lived idea object.
- A `seed_revision` is an immutable snapshot of the seed at a point in time.
- A `trace_step` is one transformation cycle from one revision to the next.
- Fan-out can be:
  - competitive: same question across providers/models, outputs compete
  - cooperative: same seed revision spawns different specialized agent tasks, outputs compose
  - git-backed: work materially changes a repository and Git becomes the strongest lineage evidence
- `fruits` is a candidate user-facing term for outputs/artifacts/results produced from seeds.
- Users should be able to inspect a seed, branch it manually, edit it by creating a new revision, and attach new evidence either explicitly or through parser-assisted inference.

## What You Need To Produce

Produce a clearer handoff-quality spec in `scratchpad/` that does all of the following:

1. Defines the core objects in plain English.
2. Defines the main user-facing pages and what each page is for.
3. Explains how a user moves between private work, lineage exploration, uploading new evidence, and public posting.
4. Resolves terminology as much as possible without prematurely locking schema names.
5. Identifies the biggest unresolved product tensions that should stay open.

## Required Deliverables

Create or update scratchpad-only docs that cover these five sections:

### 1. Concept Model

Define these objects clearly:

- `seed`
- `seed_revision`
- `trace_step`
- `prompt`
- `run`
- `response`
- `selection`
- `upload`
- `artifact`
- `fruit` if you think it should remain as a user-facing term

For each object, explain:

- what it is
- whether it is user-facing, internal, or both
- what problem it solves
- how it relates to the other objects

### 2. Trace Patterns

Document the three pattern types:

- competitive fan-out
- cooperative fan-out
- git-backed execution

For each pattern, explain:

- what the user is doing
- what the lineage shape looks like
- what metadata matters most
- what UI affordances the product likely needs

### 3. Page / Layout Spec

Use the sketches to write a page-level spec for:

- landing/feed page
- seed detail page
- journey/path page

For each page, specify:

- purpose
- primary panels/regions
- primary actions
- how private/public state should feel
- how uploads and posting should enter the flow

### 4. Ingestion / Linking Flows

Write explicit flows for:

- creating a brand-new seed
- adding a new prompt/response cycle to an existing seed
- manually branching from a seed revision
- attaching uploads or artifacts to a known point in the lineage
- dropping raw material into intake and letting the system infer placement
- posting private seed material publicly

For each flow, note:

- what the user knows
- what the system infers
- where confidence matters
- what can remain unresolved/orphaned

### 5. Open Questions

List the major unresolved questions, especially:

- how `seed` relates to the existing `node` concept in the repo docs
- whether `fruit` should be a product term, a UI metaphor, or dropped
- what should be public by default versus private by default
- how much manual correction users should have over inferred lineage
- whether the landing page is primarily vault-first or feed-first

## Output Expectations

The output should be practical, not poetic.

- Prefer explicit definitions over vibe language.
- Use examples when they reduce ambiguity.
- Do not drift into implementation code or database migrations.
- Do not rewrite `PRD.md`, `SCHEMA.md`, or `ARCHITECTURE.md`.
- Keep the work in `scratchpad/` as an exploratory but high-signal product spec.

## Recommended File Strategy

You may either:

- expand `/Users/mschwar/Documents/slopvault/scratchpad/scratchpad.md`

or create one or two focused scratchpad docs, for example:

- `/Users/mschwar/Documents/slopvault/scratchpad/seeds-trace-spec.md`
- `/Users/mschwar/Documents/slopvault/scratchpad/seeds-trace-open-questions.md`

Do not touch the canonical docs yet.

## Acceptance Criteria

This handoff is successful if:

- another person can read only the scratchpad materials and understand the current seed/trace model
- the difference between `seed`, `trace`, `artifact`, and `fruit` is clear
- the three page types are clearly described
- the three trace patterns are clearly distinguished
- the private-to-public flow is explicit
- unresolved tensions are named instead of being silently glossed over

## Things To Avoid

- Do not collapse `seed` into a single prompt or artifact.
- Do not use `node` casually for lineage internals because the product already uses `nodes` elsewhere.
- Do not assume timestamps alone solve lineage.
- Do not assume all fan-out is competitive; agent-based cooperative fan-out is important.
- Do not replace Git lineage with SlopVault lineage in repo-backed work.
- Do not force premature schema decisions into the main docs.

## Short Version For The Agent

Read the scratchpad and the three sketches.
