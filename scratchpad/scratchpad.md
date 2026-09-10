
1) before we parse anything, we need to know what is being parsed. 
* enumerate the popular surfaces (Web/APP/CLI-OAI, Gemini, Anthropic, XAI) 
	* corresponding 'gold standards' (in the case of a CLI the JSON file, in the case of googles ai you can access the json in google drive). 
	* then we test the copy/paste with each one and cross-reference the copy paste with the gold standard.
* OpenAI surfaces
	* Codex CLI
		* surface: terminal-native Codex sessions in a local repo.
		* gold standard: local transcript artifacts under `~/.codex/sessions/` and `~/.codex/archived_sessions/*.jsonl`, with `~/.codex/session_index.jsonl` and `~/.codex/state_5.sqlite` as supporting indexes/state.
		* note: `~/.codex/history.jsonl` is not the gold standard; it is only a thin history of user-entered prompts.
	* Codex mac app
		* surface: desktop Codex threads with built-in worktrees, Git tools, skills, automations, and per-thread terminals.
		* gold standard: depends on execution mode. For web/cloud-delegated Codex usage, the official record is the Compliance API. For local app usage, there does not appear to be a supported transcript export; the best local fallback is `~/Library/Application Support/Codex/`, especially `Local Storage/leveldb/` and `Session Storage/`, but those stores are opaque app internals rather than a clean export format.
	* ChatGPT.com
		* surface: signed-in ChatGPT web conversations.
		* gold standard: the official account export zip from ChatGPT Data Controls / Privacy Portal.
		* preferred file inside the export: `conversations.json` (ground truth). `chat.html` is useful as a human-readable comparison layer, but not the main machine-readable source of truth.
* Gemini surfaces
	* Gemini web app (`gemini.google.com`)
		* surface: browser-based Gemini chats, including normal chat, Temporary Chat, Gems, connected apps, and some Chrome-integrated flows.
		* gold standard: `Gemini Apps Activity` in the Google account when `Keep Activity` is on.
		* export path: Google Takeout for account-level export; the in-product activity view is the first place to inspect per-chat records.
		* note: Google’s `Recent` / pinned chat UI is a convenience layer over activity, not a stronger source of truth. Deleting a recent chat also deletes the related Gemini Apps activity.
		* note: if `Keep Activity` is off, Google says chats may still be retained for up to 72 hours for service/safety, but they do not appear in `Gemini Apps Activity`, so durable user-accessible ground truth is reduced.
	* Gemini mobile app (Android / iPhone / iPad, including Gemini Live)
		* surface: mobile Gemini app interactions, including live voice/video/screenshare flows.
		* gold standard: also `Gemini Apps Activity`.
		* special case: for Gemini Live, the activity item may include transcripts plus downloadable audio/screenshare/video data from the `Details` view.
	* Google AI Studio (`aistudio.google.com`)
		* surface: developer-facing Gemini prompt/chat/build environment.
		* gold standard: if project logging is enabled, the AI Studio `Logs` view is the strongest documented source of truth because it exposes the full prompt, complete response, previous-turn context, and can export curated datasets as `JSONL`, `CSV`, or Google Sheets.
		* fallback gold standard: if logging is not enabled, the next-best supported record is the saved item in AI Studio `History` / `Library` if the chat or prompt was explicitly saved.
		* adjacent gold standard for single-turn reproducibility: `Get code`, because it preserves the exact model call shape/settings for that saved prompt state even when it is not a full conversation transcript.
		* caveat: I did not find official Google docs that clearly document a simple per-chat file export for AI Studio comparable to ChatGPT `conversations.json`; the officially documented machine-readable export path is through `Logs` -> dataset export when logging is enabled.
		* working inference: AI Studio may persist saved items into Google Drive-backed files, but that storage mechanism is not clearly specified in the official docs, so we should treat Drive-file parsing as opportunistic rather than contractual until directly verified.
* Anthropic surfaces
	* Claude.ai web app / Claude Desktop
		* surface: primary consumer/productivity chat surface for Claude in browser and desktop app.
		* gold standard: official account export from `Settings` -> `Privacy` -> `Export data` on the web app or Claude Desktop.
		* note: Anthropic says the export includes conversation data and user data for the account.
		* note: desktop likely has local browser-style storage under `~/Library/Application Support/Claude/`, but the supported export is stronger and cleaner than reverse-engineering IndexedDB.
	* Claude mobile apps
		* surface: Claude on iOS/Android.
		* gold standard: still the same account export, but initiated from the web app or Claude Desktop.
		* note: Anthropic explicitly says exports cannot be run from the mobile apps.
	* Claude Code (`claude` CLI)
		* surface: local coding agent / CLI with resumable sessions.
		* gold standard: local project session transcripts under `~/.claude/projects/<project>/<session>.jsonl`.
		* supporting indexes/state: `~/.claude/projects/*/sessions-index.json`, `~/.claude/history.jsonl`, `~/.claude/file-history/`, and `~/.claude/debug/`.
		* note: official Anthropic docs say Claude Code may store sessions locally for up to 30 days to enable session resumption; on this machine the full-fidelity transcript appears to be the per-session project `jsonl`, not the top-level `history.jsonl`.
* xAI / Grok surfaces
	* Grok.com web app / Grok mobile apps
		* surface: xAI’s standalone Grok consumer product on `grok.com`, iOS, and Android.
		* gold standard: in-product conversation history on `grok.com/history`.
		* business / enterprise variant: team and shared conversation history on `grok.com/history?tab=shared-with-me`, with workspace separation between personal and team workspaces.
		* caveat: I did not find official xAI docs describing a self-serve full conversation export format for Grok.com comparable to ChatGPT `conversations.json` or Claude export archives.
	* Grok in X (`x.com` / X apps)
		* surface: the X-integrated Grok experience on web, iOS, and Android.
		* gold standard: the live in-product conversation history before deletion, plus the X privacy settings state that governs Grok retention/training usage.
		* caveat: official X help documents how to delete all Grok conversation history, but I did not find a documented self-serve export/download path for Grok conversations on X.
		* implication: for parser testing, capture raw copy/paste and screenshots promptly before the user clears history.
	* xAI API / Console
		* surface: developer/API use through `api.x.ai`, `console.x.ai`, and third-party editors/clients hitting xAI endpoints.
		* gold standard: the developer’s own request/response logs or saved payloads are the primary source of truth; xAI’s admin `Audit Log` in `console.x.ai` is supporting evidence for who called what and when, not a full transcript store.
		* retention note: xAI says API requests/responses are temporarily stored server-side for 30 days for abuse/misuse auditing unless otherwise agreed, and xAI does not train on API inputs/outputs without explicit permission.

* test matrix v0
	* purpose
		* for each surface, capture one real copy/paste sample and one corresponding gold-standard record, then compare what survives, what mutates, and what disappears.
	* comparison checklist
		* timestamps present? exact or rounded?
		* model/provider name present? exact alias or generic label?
		* prompt recoverable?
		* response text complete?
		* reasoning/thinking present, redacted, or dropped?
		* attachments / uploads represented?
		* tool calls / code execution / artifacts represented?
		* message boundaries preserved?
		* user / assistant role markers preserved?
		* system/UI junk introduced by copy/paste?
	* rows
		* `openai_codex_cli`
			* raw sample: select all visible terminal session text and paste into a fixture file.
			* gold standard: matching `~/.codex/archived_sessions/<session>.jsonl` or active session file plus `session_index.jsonl`.
			* main questions: does terminal copy collapse tool boundaries? does it omit hidden reasoning/tool metadata? does it preserve timestamps at all?
		* `openai_codex_mac_app_local`
			* raw sample: select all visible thread text in the app and paste into a fixture file.
			* gold standard: best-effort local fallback from `~/Library/Application Support/Codex/` if no supported export exists for that local thread.
			* main questions: what app chrome pollutes the paste? can we recover thread metadata from visible text alone?
		* `openai_codex_cloud_or_web`
			* raw sample: copy/paste from the visible Codex thread.
			* gold standard: Compliance API record for the same task/thread when available.
			* main questions: what structured events exist in the official record that never appear in user copy/paste?
		* `openai_chatgpt_web`
			* raw sample: `Ctrl+A` / `Cmd+A` in the conversation view, then paste into a fixture file.
			* gold standard: exported `conversations.json`; secondary human check against `chat.html`.
			* main questions: how much UI junk appears, and can prompt/response boundaries be reliably reconstructed?
		* `gemini_web`
			* raw sample: `Ctrl+A` / `Cmd+A` in the chat view, then paste into a fixture file.
			* gold standard: matching item in `Gemini Apps Activity`; account-level export via Google Takeout when needed.
			* main questions: what is visible in Recent/chat UI but absent in activity, and vice versa?
		* `gemini_mobile_or_live`
			* raw sample: share/copy transcript from the mobile app if possible, otherwise manual copy from web sync view.
			* gold standard: `Gemini Apps Activity` details, including transcript/audio/video/screenshare artifacts for Live when available.
			* main questions: which multimodal details survive the paste, and which require activity metadata?
		* `gemini_ai_studio`
			* raw sample: copy the visible prompt/response exchange from AI Studio.
			* gold standard: `Logs` export (`JSONL` preferred), otherwise saved History/Library item plus `Get code`.
			* main questions: does copy/paste preserve model/settings/tool context, or only the visible text?
		* `anthropic_claude_web_desktop`
			* raw sample: `Ctrl+A` / `Cmd+A` in the conversation view, then paste into a fixture file.
			* gold standard: Anthropic account export from `Settings` -> `Privacy` -> `Export data`.
			* main questions: how much of the message tree and metadata survives plain-text capture?
		* `anthropic_claude_mobile`
			* raw sample: copy/share from mobile or from the synced web view for the same thread.
			* gold standard: same account export initiated from web/desktop.
			* main questions: are mobile-specific UI elements contaminating the paste?
		* `anthropic_claude_code`
			* raw sample: copy the visible CLI transcript from the terminal.
			* gold standard: `~/.claude/projects/<project>/<session>.jsonl`; supporting context from `history.jsonl` and `file-history/`.
			* main questions: what tool-use, progress, and file-history events are invisible in the pasted transcript?
		* `xai_grok_web`
			* raw sample: `Ctrl+A` / `Cmd+A` in the Grok conversation view, then paste into a fixture file.
			* gold standard: conversation page in `grok.com/history`.
			* main questions: without formal export, what stable identifiers and timestamps are visible enough to anchor lineage?
		* `xai_grok_in_x`
			* raw sample: copy from Grok inside X before clearing history.
			* gold standard: live in-product history plus screenshot(s) of the thread and relevant X Grok settings state.
			* main questions: what evidence is lost permanently if the user deletes history before capture?
		* `xai_api`
			* raw sample: if a client shows rendered output, copy that visible transcript or console output.
			* gold standard: locally saved request/response payloads; supporting evidence from `console.x.ai` Audit Log and stored `response.id` records within retention.
			* main questions: what metadata exists only in the API payload and never appears in rendered chat-style views?
	* fixture template
		* `surface_id`
		* `sample_id`
		* `capture_date`
		* `source_account_or_workspace`
		* `raw_paste_path`
		* `gold_standard_path_or_url`
		* `matched_thread_id_or_session_id`
		* `timestamp_start`
		* `timestamp_end`
		* `provider`
		* `product_surface`
		* `model_label_visible`
		* `model_label_gold`
		* `prompt_present_in_paste`
		* `prompt_present_in_gold`
		* `reasoning_present_in_paste`
		* `reasoning_present_in_gold`
		* `attachments_present`
		* `tool_calls_present`
		* `ui_junk_patterns`
		* `losses_observed`
		* `parser_requirements`
	* immediate collection order
		* `openai_chatgpt_web`
		* `anthropic_claude_web_desktop`
		* `gemini_web`
		* `xai_grok_web`
		* `openai_codex_cli`
		* `anthropic_claude_code`
		* `gemini_ai_studio`
		* the rest after the first-pass heuristics stabilize


2) we want to seamlessly find, trace, and integrate jumps between and within platforms (like photos taken from multiple phones in one case, or the same user taking multiple pictures). timestamps seem like a natural place to start. we follow the seed.
* working model: the seed is the underlying idea, not a single prompt or a single artifact.
* the seed evolves through a repeated loop:
	* the idea gets expressed as a prompt.
	* that prompt may be sent to multiple providers/models in parallel (same or near-identical prompt across OAI, Anthropic, Gemini, xAI, etc.).
	* the seed now carries `n` responses to the same prompt.
	* one response, or a synthesis of several responses, is selected as the winner.
	* the selected result mutates the seed: the idea has now grown, narrowed, branched, or been reframed.
	* rinse and repeat until the trace breaks or can no longer be confidently reconstructed.
* the trace, then, is the seed's journey through successive prompt/response/selection cycles.
* timestamps are the first anchor because they help reconstruct ordering, clustering, and likely handoffs across platforms.
* but timestamps alone are not enough. the trace also needs to account for semantic continuity:
	* same or near-identical prompts across providers
	* copied phrases/fragments passed from one response into the next prompt
	* explicit user selection of the "best" response
	* prompt revisions that preserve the same underlying idea
* each trace node may be internally complex rather than a single prompt/response pair. a node may contain:
	* multiple responses to the same prompt
	* user uploads attached to the prompt/response cycle
	* CoT / reasoning / thinking output where available
	* generated artifacts produced from the exchange
* implication for SlopVault: we are not just storing isolated artifacts. we are trying to reconstruct and preserve the evolving seed, including fan-out, selection, branching, and attached materials, until confidence runs out.
* terminology note: avoid using `node` for this internal lineage structure because the product already uses `nodes` for bundled/public-facing projects. use `trace_step`, `seed_revision`, `run`, etc.

* useful pattern taxonomy
	* competitive fan-out
		* one `seed_revision`
		* one prompt family or one question asked several ways
		* many provider/model runs answering the same underlying question
		* outputs compete
		* user selects a winner or synthesizes several responses into the next `seed_revision`
		* example: same prompt sent to OAI, Gemini, Anthropic, and xAI to see which answer is strongest
	* cooperative fan-out
		* one `seed_revision`
		* many specialized prompts or agents doing different jobs in parallel
		* outputs do not compete; they compose
		* all outputs remain attached to the same `seed_revision`
		* example: the same idea state is used to spawn a research pass, schema draft, parser draft, design mock, and implementation draft
	* git-backed execution
		* one `seed_revision`
		* one or many agent/user runs materially change a repository
		* code lineage should rely on Git as the strongest source of truth for file-level history
		* SlopVault should not try to replace Git history; it should connect the seed/trace to Git refs, commits, branches, diffs, and resulting artifacts
		* example: `idea-v1.03` leads to an agent run that creates a parser prototype on branch `codex/parser-prototype` from commit `abc123` to commit `def456`

* practical data model direction
	* `seed`
		* the long-lived identity of the rabbit hole / project / idea
	* `seed_revision`
		* an immutable snapshot of the idea at a moment in time (`idea-v0`, `idea-v0.01`, `idea-v0.02`, etc.)
		* never edited in place; each revision is derived from prior work
	* `trace_step`
		* one transformation cycle from one `seed_revision` to the next
		* may be a competitive batch, cooperative batch, or git-backed execution step
	* `prompt`
		* the authored instruction text or prompt template
	* `run`
		* one execution of a prompt on a specific provider/model/surface/agent at a specific time
	* `response`
		* the model/agent output for a given run
	* `selection`
		* the explicit choice, ranking, or synthesis that determines what moves the seed forward
	* `upload`
		* input-side attachment provided to the run
	* `artifact`
		* output-side object produced by the run (text, image, code patch, file, etc.)

* why cooperative fan-out matters
	* in the agent case, many outputs should be linked to the same `seed_revision`, because they are parallel work products produced from the same idea state
	* this enables useful queries:
		* show me everything generated from `idea-v1.02`
		* show me everything produced by the research agent
		* show me all artifacts and code changes created during this round of work
	* this becomes essential once the user is building something substantive, because the number of prompts, responses, files, and outputs becomes unwieldy very quickly

* git-backed execution principle
	* before a repo exists, trace reconstruction depends mostly on timestamps, prompt similarity, uploads, copied fragments, and platform metadata
	* once a repo exists, Git should become the primary evidence for code lineage
	* SlopVault should preserve the bridge between seed lineage and repo lineage:
		* repo identity
		* branch name
		* base commit / head commit
		* commit range
		* files changed
		* tests run / build outputs / screenshots / PR links
	* code-heavy workflows should therefore be modeled as hybrid traces:
		* SlopVault tracks idea evolution, prompts, agent roles, selections, uploads, and non-code artifacts
		* Git tracks file-level and commit-level evolution
		* the trace connects them

* minimum metadata by pattern
	* competitive fan-out
		* shared prompt family id
		* provider/model/surface per run
		* run timestamps
		* responses
		* selected response id or synthesis note
	* cooperative fan-out
		* shared `seed_revision`
		* agent role / task type per run
		* uploads in
		* artifacts out
		* whether outputs are complementary, not competing
	* git-backed execution
		* shared `seed_revision`
		* repo/branch/commit metadata
		* diff or commit references
		* resulting build/test artifacts
		* links back to the prompting and agent context that caused the code change

* fingerprinting direction
	* fan-out cases are likely to produce many prompts that are exact copies or share strong textual DNA
	* this suggests a useful lineage heuristic: fingerprint prompts and use those fingerprints to cluster prompt families and infer likely shared seed ancestry
	* important distinction:
		* prompt fingerprint = fingerprint of the authored instruction text
		* prompt-family fingerprint = fuzzy grouping for prompts that are not identical but are clearly variants of the same instruction
		* seed fingerprint = higher-level fingerprint of the underlying idea state; this is harder and should be treated as evidence, not absolute truth

* prompt fingerprint strategy
	* exact fingerprint
		* normalize prompt text first:
			* strip platform UI junk
			* normalize whitespace
			* normalize obvious pasted metadata noise
			* preserve meaningful wording and structure
		* hash the normalized prompt
		* use this for exact prompt reuse across providers/models/surfaces
	* fuzzy fingerprint
		* compute a similarity-oriented fingerprint over the normalized prompt
		* use this to group prompts that differ only by light edits, provider-specific wrappers, or minor refinements
		* this becomes the likely `prompt_family_id`
	* practical implication
		* if OAI, Gemini, Anthropic, and xAI all receive the same normalized prompt within a narrow time window, that is strong evidence of competitive fan-out from the same `seed_revision`

* seed fingerprint strategy
	* the seed is harder to fingerprint because it is not always represented by one stable text blob
	* a `seed_revision` may be expressed through:
		* the selected response from the prior step
		* a user rewrite or synthesis
		* attached uploads
		* generated artifacts
	* therefore a seed fingerprint probably needs to be composite:
		* prior `seed_revision` pointer
		* prompt-family fingerprints launched from this revision
		* selected/synthesized text fragments
		* upload hashes or IDs
		* artifact IDs or hashes
	* this should be used to support reconstruction, not to declare identity with total certainty

* evidence hierarchy for reconstruction
	* strongest
		* exact prompt fingerprint match
		* shared upload hash
		* direct Git ancestry
		* explicit user selection / explicit parent-child relation
	* medium
		* fuzzy prompt-family match
		* strong text overlap between prior response and next prompt
		* close timestamp clustering
	* weaker
		* semantic similarity without textual reuse
		* inferred shared topic without other anchors

* implementation intuition
	* fingerprints should create candidate links, not final truth on their own
	* the system should cluster first, then score links using multiple signals:
		* timestamps
		* prompt fingerprints
		* shared uploads
		* selected-response reuse
		* provider/model metadata
		* Git history when present
	* this would let SlopVault reconstruct "same prompt sent everywhere" and "lightly edited prompt family" cases far more reliably than timestamps alone

* product implication: the seed itself is a first-class feature
	* each surfaced `seed` should be directly accessible to the user as an object they can inspect and work from
	* the user should be able to:
		* open a seed and view its journey across `seed_revisions`, `trace_steps`, prompts, runs, responses, uploads, artifacts, and Git-backed executions
		* manually create a new branch from a seed or from a specific `seed_revision`
		* make changes to the seed itself
	* important integrity rule:
		* the user should not mutate old `seed_revisions` in place
		* "editing the seed" should usually mean creating a new `seed_revision` derived from the current one, with explicit provenance that this was a manual user edit rather than a model response
	* this preserves both usability and lineage integrity:
		* the user gets a living object they can actively steer
		* the system keeps a trustworthy historical trace instead of overwriting prior states

* manual branching
	* branching should not require model fan-out or inferred lineage; the user should be able to branch intentionally
	* useful cases:
		* "take this idea in a different direction"
		* "freeze this research path and start a productization path"
		* "fork this seed before trying a riskier prompt strategy"
	* manual branching likely needs:
		* source `seed_revision`
		* new branch seed id or branch id
		* user-supplied branch label / note
		* timestamp

* user edits as lineage events
	* user-authored edits should be first-class trace events, not hidden cleanup
	* examples:
		* rewriting the seed summary
		* merging insights from several model responses into one cleaner idea state
		* attaching notes, uploads, or constraints before the next round
	* this is especially important because some of the most meaningful evolution happens outside the model UI and would otherwise be lost

* seed detail surface
	* each `seed` should have a dedicated user-facing page/surface
	* core fields:
		* name
		* X-style brief summary
		* extended description
		* links
			* linked seeds
			* linked artifacts
			* linked repos / branches / PRs
			* external references as needed
	* likely additional context worth showing:
		* current revision
		* branch count
		* last activity time
		* status (`active`, `archived`, etc.)

* seed actions / options
	* archive seed
	* post/share seed on the site
	* manually branch from current revision or a selected historical revision
	* create a new manual `seed_revision`
	* attach additional data
		* user chooses exact placement in the lineage
		* or user drops it into the parser / intake flow and SlopVault makes its best guess about where it belongs
	* relink or confirm uncertain lineage suggestions

* adding data to an existing seed
	* mode 1: explicit placement
		* the user navigates to the correct `trace_step` or `seed_revision`
		* uploads / pasted transcripts / artifacts are attached there intentionally
		* best for users who already know where the material belongs
	* mode 2: inferred placement
		* the user drops raw data into the parser/intake flow
		* SlopVault parses it, scores likely attachment points, and proposes its best guess
		* the user can confirm, override, or leave it as an orphan / low-confidence fragment
	* this is important because real workflows are messy; users will often discover lineage evidence after the fact

* product tension to resolve later
	* "post/share seed on the site" may overlap with the existing `node` concept in the product docs
	* likely options:
		* published seeds and published nodes are distinct objects
		* a node is a public/shareable view generated from seed material
		* a seed can be shared privately/internal-first, while nodes remain the public feed primitive
	* keep this open in the scratchpad for now; do not force it into the existing schema yet

3) layout / IA sketches
* working vocabulary from the sketches:
	* `seeds` = the core idea objects and their lineage
	* `fruits` = outputs/artifacts/results produced from seeds
	* keep this vocabulary open for now; `fruits` may become a user-facing term even if the underlying schema still uses `artifacts`

* landing page sketch
	* left rail
		* persistent navigation / collections
		* shared seeds
		* private seeds
		* fruits / artifacts / papers / outputs
		* shared fruits
		* connected fruits
		* likely a bucket for orphaned / unplaced / low-confidence material
	* center column
		* feed-first experience
		* interactions with your seeds
			* forks
			* fruits
			* artifacts
			* questions / comments / responses
		* new user seeds
		* new user fruits
		* viral seeds / fruits
	* bottom action zone
		* `post` (move material from private -> public)
		* `upload` (prompts, artifacts, transcripts, other evidence)
* implication:
	* the home page is not just a static dashboard; it is a live feed of activity around seeds and fruits
	* the left rail gives the user direct access to their private working set and public/shared material without losing the feed context

* seed detail page sketch
	* left rail
		* same or very similar navigation as the landing/feed page
		* important for continuity; the user should not feel like they left the vault/feed system when opening a seed
	* center column
		* seed header
			* name
			* brief summary
			* description
			* edit affordance
		* stats block
			* likely counts/health/activity for the seed
			* examples: revisions, branches, linked fruits, linked artifacts, collaborators/forks, last touched time
		* journey / path entry point
			* either an embedded graph/timeline panel
			* or a strong CTA that opens the full journey/path view
	* right rail
		* linked artifacts / fruits
		* linked seeds
		* external links / repos / branches / PRs
		* possibly unresolved lineage suggestions / related material
	* bottom action zone
		* post/share
		* upload
		* likely also branch, archive, and add revision

* journey/path view sketch
	* there appears to be a dedicated view where the center column is dominated by the seed journey/path itself
	* the journey can be represented as:
		* graph
		* node-link tree
		* timeline
		* or a hybrid graph/timeline
	* design implication:
		* the journey/path should not be reduced to a tiny side widget
		* complex seeds need a full-screen or center-dominant exploration mode

* emerging product structure from the sketches
	* page type 1: feed / landing
		* activity and discovery
	* page type 2: seed detail
		* metadata + stats + linked outputs + actions
	* page type 3: journey/path
		* lineage exploration and manual correction
* this is a good split because it separates:
	* social/public discovery
	* object-level editing and management
	* deep lineage exploration

* UI implications to preserve
	* left-rail continuity across pages
	* strong central focus on either feed or journey, depending on page
	* right rail for attachments / linked material / context
	* bottom action band for `post` and `upload`, which feels consistent with the founder workflow of constantly adding and optionally publishing material

* unresolved but promising idea from the sketches
	* the system may need explicit views for:
		* private seeds
		* shared/public seeds
		* fruits/artifacts not yet connected to a seed
		* fruits/artifacts that are connected across multiple seeds
	* that last case could become a distinctive discovery surface, because it highlights outputs that bridge rabbit holes rather than living inside one lineage tree
