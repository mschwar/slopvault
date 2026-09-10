# Seeds, Trace, and Posting Spec

Status: scratchpad-only working spec. This clarifies product behavior and vocabulary without changing the canonical schema or architecture docs.

This spec assumes the current product direction from the canonical docs:

- the parser remains the hero feature
- the private vault remains the primary experience
- provenance and lineage matter, but the full ledger may stay partly hidden in MVP
- `node` remains reserved for the existing bundle/public-share concept unless the canonical docs change

## Working Terms

- `seed`: the long-lived idea or rabbit hole
- `artifact`: the neutral system term for saved outputs or evidence objects
- `fruit`: optional user-facing language for outputs that grew from a seed; not recommended as a schema term
- `node`: keep reserved for the current public/share bundle model from `SCHEMA.md`

Working product rule: do not use `node` for seed lineage internals. Use `seed`, `seed_revision`, `trace_step`, `run`, and `artifact`.

## Model In One Sentence

A seed evolves through immutable revisions; each revision can launch one or more trace steps; each trace step contains prompts, runs, responses, uploads, selections, and resulting artifacts; those materials can later be packaged for public posting.

```text
seed
  -> seed_revision A
    -> trace_step
      -> prompt(s)
      -> run(s)
      -> response(s)
      -> selection(s)
      -> upload(s) in
      -> artifact(s) out
  -> seed_revision B
```

## 1. Concept Model

### `seed`

- What it is: the durable identity of an idea, project, or rabbit hole across time.
- User-facing or internal: both.
- Problem it solves: gives the user one stable object to return to when work is scattered across many prompts, providers, files, and sessions.
- Relation to other objects:
  - has many `seed_revision` records
  - may have sibling or child seeds if the user branches intentionally
  - accumulates linked `artifact` and `upload` records over time
  - may later be published through a separate public object such as a `node`

Example: "Civilizational Substrate Technologies" is a seed. It survives even when the user has moved from ChatGPT to Gemini to notes to code.

### `seed_revision`

- What it is: an immutable snapshot of the seed at a specific moment.
- User-facing or internal: both, though it may be compressed in simple views.
- Problem it solves: preserves history without overwriting the idea state in place.
- Relation to other objects:
  - belongs to one `seed`
  - is produced by a `trace_step` or an explicit manual user edit
  - can be the launch point for new prompts, runs, uploads, and branches
  - can be the source revision for a manual branch

Working product rule: "edit seed" should usually mean "create a new seed revision," not "mutate an old revision."

### `trace_step`

- What it is: one transformation cycle from one seed revision to the next.
- User-facing or internal: both.
- Problem it solves: groups the evidence for how the seed changed instead of forcing the user to infer change from isolated artifacts.
- Relation to other objects:
  - starts from one `seed_revision`
  - contains one or more `prompt`, `run`, `response`, `selection`, `upload`, and `artifact` records
  - ends in either a new `seed_revision`, a branch, or an unresolved state

Examples:
- competitive fan-out: same question asked to four models
- cooperative fan-out: one revision spawns research, writing, and code tasks
- git-backed step: an agent run changes a repo and produces a commit range

### `prompt`

- What it is: the authored instruction text, question, or prompt template that expresses the current seed revision to a model or agent.
- User-facing or internal: both.
- Problem it solves: preserves what was asked, not just what came back.
- Relation to other objects:
  - belongs to a `trace_step`
  - may be reused across many `run` records
  - may belong to a prompt family when lightly edited variants are treated as the same underlying ask
  - may reference `upload` records as inputs

Important distinction: the prompt is authored intent; it is not the same thing as the seed.

### `run`

- What it is: one execution of a prompt on a specific provider, model, surface, or agent at a specific time.
- User-facing or internal: mostly internal, but should be inspectable in lineage views.
- Problem it solves: captures the concrete event that produced a response, including source metadata.
- Relation to other objects:
  - references one `prompt`
  - belongs to one `trace_step`
  - produces one or more `response` or `artifact` outputs
  - may consume `upload` inputs
  - may link to Git metadata if repo-backed

Example: "Run prompt P1 on Gemini 2.0 Flash in AI Studio at 11:42 AM."

### `response`

- What it is: the model or agent output from a run before the user decides what to do with it.
- User-facing or internal: both.
- Problem it solves: keeps the immediate output available for comparison, selection, and audit even when only part of it becomes durable.
- Relation to other objects:
  - belongs to one `run`
  - may be turned into a saved `artifact`
  - may feed into a `selection`
  - may contribute text or structure to the next `seed_revision`

Working distinction: a text response often becomes an artifact after parsing and saving, but the concepts should stay separate.

### `selection`

- What it is: the explicit choice, ranking, or synthesis that determines what moves the seed forward.
- User-facing or internal: both.
- Problem it solves: records why one output mattered more than another and how the next revision was formed.
- Relation to other objects:
  - belongs to a `trace_step`
  - references one or more `response` or `artifact` records
  - may create a synthesis note
  - usually leads to the next `seed_revision`

Examples:
- "Use Claude answer as winner"
- "Merge sections 2 and 4 from Gemini and ChatGPT"
- "Keep all three specialized outputs; move forward with a combined revision"

### `upload`

- What it is: user-supplied input attached to the lineage, such as an image, text file, screenshot, pasted notes, audio link, or repo reference.
- User-facing or internal: both.
- Problem it solves: preserves context that did not originate as a model response.
- Relation to other objects:
  - may attach to a `seed`, `seed_revision`, or `trace_step`
  - may be an input to a `prompt` or `run`
  - may remain unresolved if the system cannot confidently place it
  - may also become a saved `artifact` when the user wants it in the vault

Working distinction: upload means "how this material entered the system"; artifact means "saved object the user can retrieve and reuse."

### `artifact`

- What it is: a durable saved object in the vault, such as parsed text, an image, an audio link, a file, a screenshot, a code patch summary, or other evidence/result the user wants to keep.
- User-facing or internal: both.
- Problem it solves: gives the user a retrievable, displayable unit of work without requiring the entire trace view.
- Relation to other objects:
  - may originate from a `response`, an `upload`, or a manual note
  - may link to one or more `seed`, `seed_revision`, or `trace_step` records
  - may later be bundled into a public `node`
  - may remain orphaned or low-confidence until linked

Important distinction: not every artifact is the "winner." Many artifacts are evidence or side outputs.

### `fruit`

- What it is: a candidate user-facing metaphor for outputs that grew from a seed.
- User-facing or internal: user-facing only, if kept at all.
- Problem it solves: gives non-technical language for "artifact produced from this seed."
- Relation to other objects:
  - best treated as a view label layered on top of `artifact`
  - should refer mainly to output-side artifacts, not every upload or evidence object

Working recommendation: keep `artifact` as the neutral product/system term and treat `fruit` as optional UI language to test later. If users find it cute but unclear, drop it.

## 2. Trace Patterns

### Pattern A: Competitive Fan-Out

- What the user is doing: asking the same underlying question across providers or models to compare answers.
- Lineage shape:

```text
seed_revision A
  -> one prompt family
  -> many parallel runs
  -> many responses
  -> one selection or synthesis
  -> seed_revision B
```

- Metadata that matters most:
  - normalized prompt text or prompt family fingerprint
  - provider, model, and surface per run
  - timestamps and ordering
  - explicit winner, ranking, or synthesis note
  - links showing copied fragments from response to next prompt or revision
- UI affordances likely needed:
  - side-by-side compare view for responses
  - "mark winner" and "synthesize next revision" actions
  - badges showing provider/model/surface
  - confidence indicator when the system infers a prompt family rather than knowing it explicitly

Example: the user sends the same research question to ChatGPT, Claude, Gemini, and Grok, then keeps Claude's framing but merges one Gemini paragraph.

### Pattern B: Cooperative Fan-Out

- What the user is doing: using the same seed revision to launch different specialized tasks that are meant to compose rather than compete.
- Lineage shape:

```text
seed_revision A
  -> many task-specific prompts or agent runs
  -> many complementary responses/artifacts
  -> staged aggregation or multi-part selection
  -> seed_revision B
```

- Metadata that matters most:
  - agent role or task type per run
  - which uploads were shared across tasks
  - artifact outputs by task
  - completion state per task
  - dependency or composition notes showing how outputs fit together
- UI affordances likely needed:
  - grouped task cards under one trace step
  - ability to keep several outputs active at once
  - labels like `research`, `outline`, `draft`, `schema`, `mock`, `implementation`
  - aggregation controls for building the next revision from multiple outputs

Example: one seed revision spawns a research pass, a parser design pass, a UI mock pass, and a repo implementation pass. All outputs are relevant and stay attached.

### Pattern C: Git-Backed Execution

- What the user is doing: using a seed revision to drive work that materially changes a repository.
- Lineage shape:

```text
seed_revision A
  -> one or more prompts/runs
  -> repo branch + commit range + diffs + tests
  -> resulting artifacts and decisions
  -> seed_revision B
```

- Metadata that matters most:
  - repo identity
  - branch name
  - base commit and head commit
  - commit range or PR reference
  - files changed
  - tests, build output, screenshots, or deploy links
  - agent/user that caused the code change
- UI affordances likely needed:
  - repo panel in the inspector
  - commit and branch references in the path view
  - quick jump from a trace step to the relevant diff or PR
  - summary of changed files without trying to replace Git history

Working rule: Git is the strongest source of truth for code lineage. SlopVault should connect to Git history, not duplicate it.

## 3. Page / Layout Spec

### Shared Shell

The sketches imply a common shell across the major pages:

- left rail for persistent navigation and collections
- center region for the primary page purpose
- right rail or inspector for linked material and context
- bottom action band for `upload` and `post`

This continuity matters. The user should feel like they are moving through one vault, not jumping between unrelated tools.

### Landing / Feed Page

- Purpose:
  - resume private work quickly
  - surface recent activity around the user's seeds and artifacts
  - allow optional discovery of public/shared material
- Primary panels or regions:
  - left rail:
    - private seeds
    - shared/public seeds
    - artifacts or fruits
    - connected artifacts
    - unresolved/orphaned material
  - center feed:
    - activity on your seeds
    - newly added private material
    - public discoveries or recently shared work
    - optional feed modes once the public layer matters more
  - bottom action band:
    - `Upload`
    - `Post`
- Primary actions:
  - paste or upload new raw material
  - jump back into a seed
  - open unresolved material that needs placement
  - move private material toward public posting
- How private/public state should feel:
  - for signed-in users, private work should feel primary
  - public activity should be visible, but it should not crowd out unfinished work
  - clear visual labels should distinguish private, shared, and unresolved material
- How uploads and posting enter the flow:
  - `Upload` should always be one click away from the landing page
  - `Post` should feel like promoting existing private material into a public representation, not like creating from scratch

Working recommendation: signed-in landing should be vault-first with feed behavior, not pure public-feed-first.

### Seed Detail Page

- Purpose:
  - act as the working home for one idea
  - show current state, recent history, and linked outputs without forcing the user into the full path view
- Primary panels or regions:
  - left rail: same persistent navigation
  - center:
    - seed header with name, summary, description
    - current revision summary
    - stats block
    - recent trace activity
    - clear entry point into the journey/path page
  - right rail:
    - linked artifacts/fruits
    - uploads and supporting evidence
    - linked seeds
    - repos, branches, PRs, external links
    - unresolved lineage suggestions
  - bottom action band:
    - `Upload`
    - `Add Revision`
    - `Branch`
    - `Post`
    - `Archive`
- Primary actions:
  - edit seed metadata by creating or updating the current revision context
  - attach new evidence
  - add a new prompt/response cycle
  - branch from a revision
  - open the full path view
  - post selected material
- How private/public state should feel:
  - default assumption is that the seed is private and actively worked on
  - public state, if supported later, should feel curated and partial
  - public viewers should not automatically see every trace detail that the owner sees
- How uploads and posting enter the flow:
  - upload should support both "attach here" and "let system infer placement"
  - post should begin from the seed detail page when the user decides some part of the work is ready to share

Working recommendation: posting from seed detail should publish a view of seed material, not automatically expose the full private ledger.

### Journey / Path Page

- Purpose:
  - provide deep lineage exploration
  - make branching, fan-out, and uncertain links inspectable
  - give the user a place to correct the record
- Primary panels or regions:
  - left rail: same persistent navigation
  - center:
    - full-width graph, timeline, or hybrid path view
    - branch controls
    - compare mode for runs or revisions
  - right inspector:
    - details for the selected seed revision, trace step, run, response, artifact, or Git reference
    - confidence and evidence breakdown for inferred links
  - bottom action band:
    - `Upload Here`
    - `Confirm Link`
    - `Reject Link`
    - `Branch`
    - `Post Selection`
- Primary actions:
  - inspect lineage
  - compare responses or branches
  - confirm, relink, or reject inferred placement
  - jump to attached artifacts or Git evidence
  - branch from a historical revision
- How private/public state should feel:
  - this is primarily a private analysis surface
  - if a public version exists later, it should likely be a simplified, read-only journey or recipe view
- How uploads and posting enter the flow:
  - uploads from here should inherit the currently selected placement when possible
  - posting from here should allow the user to choose a specific revision, path segment, or artifact cluster to share

## 4. Ingestion / Linking Flows

General rule across all flows: preserve raw evidence first, then infer links. Do not make the user lose material because the system is unsure.

### Flow A: Create a Brand-New Seed

1. User pastes raw material, uploads a file, or starts from a blank manual entry.
2. System parses what it can and proposes:
   - title
   - summary
   - source metadata
   - initial prompt/response split if applicable
3. User confirms "this is a new seed."
4. System creates:
   - the `seed`
   - the initial `seed_revision`
   - any parsed `response` or `artifact` records
   - unresolved items if the material is messy

- What the user knows:
  - this starts a new rabbit hole
  - they may know little more than "this belongs together"
- What the system infers:
  - source model/surface
  - first prompt and response boundaries
  - draft title and summary
  - whether the seed already looks related to an existing one
- Where confidence matters:
  - separating prompt from response
  - deciding whether one paste is one seed or several
- What can remain unresolved or orphaned:
  - extra fragments from the same paste
  - uploads or notes that are saved but not yet precisely placed

### Flow B: Add a New Prompt/Response Cycle to an Existing Seed

1. User starts from a seed page or from intake.
2. User indicates an existing seed, or the system suggests one.
3. System parses the new material and proposes a placement against a current or historical revision.
4. User confirms or overrides placement.
5. System creates a new `trace_step`, plus runs, responses, and artifacts as needed.
6. User may immediately select a winner or leave the step unresolved.

- What the user knows:
  - usually the target seed
  - often the rough point in history, but not always the exact revision
- What the system infers:
  - likely revision match
  - prompt family
  - competitive versus cooperative pattern
  - source metadata and timestamps
- Where confidence matters:
  - attaching the cycle to the right revision when many branches are active
  - grouping many runs into one trace step versus several steps
- What can remain unresolved or orphaned:
  - an unselected step
  - low-confidence runs parked under the seed but not pinned to a specific revision

### Flow C: Manually Branch from a Seed Revision

1. User selects a seed revision and chooses `Branch`.
2. User optionally provides a branch label or note.
3. System creates a new branch context rooted in that revision.
4. User continues work from the new branch without altering earlier history.

- What the user knows:
  - exactly which revision they want to fork from
  - the new direction they want to explore
- What the system infers:
  - very little; this is mostly explicit user intent
  - copied context such as summary, attached constraints, or selected artifacts
- Where confidence matters:
  - almost nowhere; explicit branch intent should override inference
- What can remain unresolved or orphaned:
  - the new branch may initially contain no new runs
  - schema representation remains open: child seed versus branch record

Working recommendation: the product can say "branch seed" now while leaving the eventual data representation open.

### Flow D: Attach Uploads or Artifacts to a Known Point in the Lineage

1. User opens a seed detail or journey view.
2. User selects a seed, revision, or trace step.
3. User uploads or links new material.
4. System stores the raw material, extracts basic metadata, and attaches it to the selected point.

- What the user knows:
  - the exact placement or at least the correct seed
- What the system infers:
  - file metadata
  - whether the material looks like input-side evidence or output-side result
  - possible links to nearby prompts or runs
- Where confidence matters:
  - deciding whether something is best treated as an upload, an artifact, or both
- What can remain unresolved or orphaned:
  - attached-to-revision but not attached-to-run
  - saved artifact with no clear output role yet

### Flow E: Drop Raw Material Into Intake and Let the System Infer Placement

1. User pastes or uploads material from the landing page or intake surface.
2. System parses it and scores candidate placements using available evidence.
3. System presents the best guesses with confidence levels.
4. User can:
   - confirm one guess
   - override and place it elsewhere
   - save it as unresolved for later

- What the user knows:
  - often only that the material is related to some earlier work
  - sometimes only the rough topic or date
- What the system infers:
  - candidate seed matches
  - candidate revision or trace step matches
  - prompt family links
  - source metadata, timestamps, shared uploads, and Git references
- Where confidence matters:
  - this is the highest-confidence-sensitive flow in the product
  - the user needs clear evidence for why a guess was made
- What can remain unresolved or orphaned:
  - entire artifacts
  - partial transcripts
  - candidate links that stay in a review queue instead of being auto-applied

Working rule: high-confidence exact matches can auto-link; medium-confidence matches should usually ask for confirmation.

### Flow F: Post Private Seed Material Publicly

1. User starts from a seed page, journey view, or selected artifacts.
2. User chooses what part of the private material should be shared.
3. System proposes a public representation:
   - title
   - hook or summary
   - included artifacts
   - optional lineage or recipe excerpt
4. User reviews what remains private versus what becomes public.
5. System creates or updates the public object.

- What the user knows:
  - which idea or outputs are worth sharing
  - what level of exposure feels safe
- What the system infers:
  - best public title and hook
  - likely artifact set
  - safe default provenance to reveal
- Where confidence matters:
  - avoiding accidental publication of private notes, uploads, or trace details
  - deciding whether the public object should point back to the full seed or just a curated subset
- What can remain unresolved or orphaned:
  - private supporting evidence that never becomes public
  - uncertain lineage segments that stay hidden from the public view

Working recommendation: public posting should usually create a curated share object derived from seed material, not turn the entire seed public by default.

## 5. Open Questions

### How does `seed` relate to the existing `node` concept?

- Why this is open:
  - canonical docs already define `node` as the public/share bundle
  - the seed model introduces a deeper lineage object with overlapping "project" behavior
- Working position:
  - keep `seed` as the lineage and private-work object
  - keep `node` as the public/share object for now
  - allow nodes to be generated from seed material instead of replacing seeds

### Should `fruit` remain in the product vocabulary?

- Why this is open:
  - it is memorable, but it may be unclear whether it means artifacts, outputs, or only "good" outputs
- Working position:
  - do not use `fruit` as a schema term
  - if used at all, use it as optional UI language for output-side artifacts
  - default neutral language should remain `artifact` or `output`

### What should be public by default versus private by default?

- Why this is open:
  - the sketches include public/shared navigation, but the canonical docs are strongly private-first
- Working position:
  - all new seeds, revisions, runs, uploads, and artifacts should be private by default
  - public sharing should be an explicit posting action
  - posting should default to a curated subset, not the entire ledger

### How much manual correction should users have over inferred lineage?

- Why this is open:
  - strong inference is useful, but bad auto-linking will destroy trust
- Working position:
  - users should be able to confirm, reject, relink, ungroup, and leave unresolved
  - raw evidence should be preserved even if links change
  - old seed revisions remain immutable, but link annotations and placements should be correctable

### Is the landing page vault-first or feed-first?

- Why this is open:
  - the sketch reads like a live feed, while the canonical docs prioritize the single-player vault
- Working position:
  - for signed-in users, landing should be vault-first with feed behavior
  - for logged-out or public contexts, a more public-feed-first variant may make sense later

### Does branching create a new seed or a branch inside one seed?

- Why this is open:
  - both models can work, and the scratchpad does not yet commit
- Working position:
  - product language can say "branch seed from this revision"
  - keep the underlying schema choice open until the visible UX is tested

### How visible should lineage be in MVP?

- Why this is open:
  - canonical docs say the hidden provenance ledger can stay mostly behind the scenes at launch
  - the current sketches point toward a visible journey/path view
- Working position:
  - seed detail can expose lightweight lineage surfaces early
  - the full journey/path view can arrive once parser quality and manual correction flows are solid

### What exactly counts as a public "path" later?

- Why this is open:
  - full private lineage may include messy drafts, false starts, and sensitive evidence
- Working position:
  - public sharing should start as recipe-like or curated-path excerpts
  - full public trace disclosure should be optional, not automatic

## Summary Decisions To Use For Future Scratchpad Work

- Use `seed`, `seed_revision`, and `trace_step` for lineage thinking.
- Keep `node` reserved for the current public/share bundle model.
- Treat `artifact` as the neutral object term.
- Treat `fruit` as optional UI language, not a schema commitment.
- Default all lineage and evidence to private.
- Preserve unresolved and orphaned material instead of forcing bad links.
- Treat Git as the strongest lineage source for repo-backed work.
