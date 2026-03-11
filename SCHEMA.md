# SCHEMA.md — SlopVault Data Model

## Overview

SlopVault uses Supabase (Postgres) as its primary data store. This document defines the canonical schema. All implementation work must conform to this schema or explicitly propose changes here before diverging.

The committed MVP schema is intentionally artifact-first. Users save text, images, and audio-link artifacts into a private vault, and the system captures provenance evidence behind the scenes. Dedicated `seed` / `trace_step` tables are still intentionally deferred, but the first hidden provenance layer is now explicit: `ingestions`, `ingestion_items`, and `artifact_links`.

The schema is designed for the full MVP plus later public-sharing phases. Not all tables need to be created at once — create them as features require them.

## Hidden Provenance Ledger (Direction, Not Separate Tables Yet)

The product direction includes a hidden provenance ledger that captures how artifacts relate across prompts, outputs, uploads, timestamps, and later public forks. In the near term:

- the user-facing storage unit is the artifact
- every capture first creates an `ingestions` envelope that preserves the raw source and review state
- extracted candidates live in `ingestion_items` until the user commits them
- best-effort provenance evidence still lives in `artifacts.metadata`
- lightweight artifact-linking now lives in `artifact_links` without committing to a full seed/trace schema yet
- later, once the evidence and UX are mature, the schema can expand to explicit seed/trace objects if needed

This document intentionally reserves room for that future without committing to those tables in the first pass.

## Tables

### profiles

Extends Supabase Auth's built-in `auth.users` table. Created automatically on user sign-up via a database trigger.

```sql
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  pseudonym   TEXT UNIQUE NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Notes:**
- `pseudonym` is the user's public display name. Chosen at sign-up. Must be unique.
- No email, real name, or avatar in this table. Pseudonymous by design.
- RLS: Users can read any profile (pseudonyms are public). Users can only update their own.

---

### artifacts

The core content table. Each row is a single user-visible artifact stored in the vault. For MVP, this is also the primary place where provenance evidence is captured.

```sql
CREATE TABLE artifacts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title            TEXT,                          -- auto-generated or user-edited
  type             TEXT NOT NULL DEFAULT 'text'   -- 'text', 'image', 'audio_link'
                   CHECK (type IN ('text', 'image', 'audio_link')),
  raw_content      TEXT,                          -- the original pasted input (text type only), preserved as-is
  parsed_markdown  TEXT,                          -- cleaned Markdown output from the parser (text type only)
  storage_path     TEXT,                          -- Supabase Storage path (image type only)
  audio_url        TEXT,                          -- external URL (audio_link type only)
  description      TEXT,                          -- user-provided description (all types, optional)
  metadata         JSONB NOT NULL DEFAULT '{}',   -- short-term home for provenance evidence; see examples below
  tags             TEXT[] NOT NULL DEFAULT '{}',  -- user-applied tags
  visibility       TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'public')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_artifacts_user_id ON artifacts(user_id);
CREATE INDEX idx_artifacts_type ON artifacts(type);
CREATE INDEX idx_artifacts_visibility ON artifacts(visibility);
CREATE INDEX idx_artifacts_tags ON artifacts USING GIN(tags);
CREATE INDEX idx_artifacts_fts ON artifacts USING GIN(
  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(parsed_markdown, '') || ' ' || coalesce(description, ''))
);
```

**Column usage by type:**

| Column | `text` | `image` | `audio_link` |
|--------|--------|---------|--------------|
| `raw_content` | Required (original paste) | NULL | NULL |
| `parsed_markdown` | Required (parser output) | NULL | NULL |
| `storage_path` | NULL | Required (Supabase Storage path) | NULL |
| `audio_url` | NULL | NULL | Required (external URL) |
| `description` | Optional | Optional (caption) | Optional |

**metadata JSONB structure (for text artifacts):**

```json
{
  "source_model": "chatgpt-o3",
  "source_surface": "chatgpt-web",
  "ingestion_id": "uuid",
  "content_role": "prompt",
  "raw_source_ref": "storage://ingestion-sources/...",
  "detected_prompt": "What percentage of world GDP relies on semiconductors?",
  "captured_at": "2026-03-10T22:14:00Z",
  "prompt_fingerprint": "sha256:...",
  "prompt_family_fingerprint": "simhash:...",
  "raw_length": 4523,
  "parsed_length": 3891,
  "parser_version": "0.1.0"
}
```

**metadata JSONB structure (for image artifacts):**

```json
{
  "source_model": "midjourney-v6",
  "source_surface": "local-upload",
  "original_filename": "cyberpunk-cat.png",
  "file_size_bytes": 2048576,
  "dimensions": { "width": 1024, "height": 1024 }
}
```

**metadata JSONB structure (for audio_link artifacts):**

```json
{
  "source_platform": "suno",
  "source_surface": "manual-link",
  "original_url": "https://suno.com/song/abc123"
}
```

Fields in `metadata` are optional and best-effort. The parser populates what it can detect for text. For images and audio, the user or upload handler provides what's available. Unknown fields are omitted rather than set to null.

**RLS policies:**
- SELECT: Users can read their own artifacts (any visibility) + anyone can read `visibility = 'public'` artifacts.
- INSERT/UPDATE/DELETE: Users can only modify their own artifacts.

---

### nodes

A later-phase bundle of related artifacts, representing a package or project view for presentation and sharing. Nodes are not the primary MVP storage unit; they sit on top of already-saved artifacts.

```sql
CREATE TABLE nodes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT,                          -- detailed description (private/editing context)
  hook            TEXT,                          -- short public-facing summary for later feed cards
  parent_node_id  UUID REFERENCES nodes(id) ON DELETE SET NULL,  -- later public fork lineage
  visibility      TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'public')),
  upvotes         INTEGER NOT NULL DEFAULT 0,    -- denormalized from votes table
  fork_count      INTEGER NOT NULL DEFAULT 0,    -- denormalized count of child nodes
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_nodes_user_id ON nodes(user_id);
CREATE INDEX idx_nodes_visibility ON nodes(visibility);
CREATE INDEX idx_nodes_parent ON nodes(parent_node_id);
```

**Notes:**
- `parent_node_id` is the public fork lineage pointer. NULL means this is an original node. Non-null means it was forked from another node.
- `hook` is the short teaser text shown on feed cards.
- `upvotes` is denormalized for query performance on the feed. The `votes` table is the source of truth.
- `fork_count` is denormalized for the "Rabbit Holes" feed. Incremented via trigger when a child node is created with this node as `parent_node_id`.

**RLS policies:** Same pattern as artifacts — own data for writes, public data for reads.

---

### ingestions

Hidden envelope for every ingest workflow. This preserves the original source material, tracks review/commit state, and gives the product a stable ingestion-level anchor without making seed/trace a first-class UX object yet.

```sql
CREATE TABLE ingestions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  kind             TEXT NOT NULL CHECK (kind IN ('source_json_upload', 'conversation_paste', 'artifact_batch', 'prompt_only')),
  status           TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'analyzed', 'committed', 'discarded', 'failed')),
  source_provider  TEXT NOT NULL DEFAULT 'unknown' CHECK (source_provider IN ('openai', 'google', 'anthropic', 'xai', 'unknown')),
  source_surface   TEXT NOT NULL DEFAULT 'unknown',
  raw_text         TEXT,
  raw_file_path    TEXT,
  raw_file_mime    TEXT,
  raw_file_name    TEXT,
  parse_version    TEXT NOT NULL,
  warnings         JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ingestions_user_id ON ingestions(user_id);
CREATE INDEX idx_ingestions_status ON ingestions(status);
CREATE INDEX idx_ingestions_kind ON ingestions(kind);
```

**Notes:**
- `raw_text` is used for conversation paste and prompt-only ingests.
- `raw_file_*` is used when the original source is a preserved upload or export file.
- `warnings` stores parser/extractor warnings surfaced during review.
- Raw source is preserved even after commit so the system can re-parse later and so the user gets immediate lock-in value.

**RLS policies:** Users can only read and modify their own ingestions.

---

### ingestion_items

Staging table for extracted candidates produced during review. Items remain here until the user commits them into `artifacts`.

```sql
CREATE TABLE ingestion_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingestion_id     UUID NOT NULL REFERENCES ingestions(id) ON DELETE CASCADE,
  position         INTEGER NOT NULL DEFAULT 0,
  item_kind        TEXT NOT NULL DEFAULT 'artifact' CHECK (item_kind IN ('artifact')),
  artifact_type    TEXT NOT NULL CHECK (artifact_type IN ('text', 'image', 'audio_link')),
  content_role     TEXT NOT NULL DEFAULT 'artifact' CHECK (content_role IN ('prompt', 'response', 'artifact', 'upload', 'unknown')),
  raw_text         TEXT,
  parsed_markdown  TEXT,
  title            TEXT,
  metadata         JSONB NOT NULL DEFAULT '{}'::jsonb,
  tags             TEXT[] NOT NULL DEFAULT '{}',
  include          BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ingestion_items_ingestion_id ON ingestion_items(ingestion_id);
CREATE INDEX idx_ingestion_items_include ON ingestion_items(include);
```

**Notes:**
- `artifact_type` matches the committed `artifacts.type` values.
- Prompt-only ingests and prompt turns are represented as `artifact_type = 'text'` plus `content_role = 'prompt'`.
- `include` lets the user exclude candidates before commit without deleting the entire ingestion.

**RLS policies:** Users can only read and modify items that belong to their own ingestions.

---

### artifact_links

Lightweight provenance edges between committed artifacts. This is the first explicit relationship layer supporting trace reconstruction without committing to full seed/trace tables yet.

```sql
CREATE TABLE artifact_links (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  from_artifact_id   UUID NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
  to_artifact_id     UUID NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
  relationship_type  TEXT NOT NULL CHECK (relationship_type IN ('prompt_to_response', 'same_ingestion', 'attachment_of', 'derived_from')),
  confidence         NUMERIC(3,2) NOT NULL DEFAULT 1.0,
  origin             TEXT NOT NULL DEFAULT 'parser' CHECK (origin IN ('system', 'parser', 'user')),
  ingestion_id       UUID REFERENCES ingestions(id) ON DELETE SET NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_artifact_links_user_id ON artifact_links(user_id);
CREATE INDEX idx_artifact_links_from_artifact ON artifact_links(from_artifact_id);
CREATE INDEX idx_artifact_links_to_artifact ON artifact_links(to_artifact_id);
CREATE INDEX idx_artifact_links_ingestion_id ON artifact_links(ingestion_id);
```

**Notes:**
- `prompt_to_response` is the most common initial edge created when a prompt item is followed by a response item in one ingestion.
- `same_ingestion` captures sequence-level proximity when a stronger semantic edge is not available.
- Later seed/trace tables can be backfilled from this data rather than starting from nothing.

**RLS policies:** Users can only read and modify their own artifact links.

---

### node_artifacts

Join table linking nodes to their bundled artifacts, with ordering.

```sql
CREATE TABLE node_artifacts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id      UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  artifact_id  UUID NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
  position     INTEGER NOT NULL DEFAULT 0,  -- display order within the node
  UNIQUE(node_id, artifact_id)
);

CREATE INDEX idx_node_artifacts_node ON node_artifacts(node_id);
```

---

### votes

Tracks upvotes on public nodes. One vote per user per node.

```sql
CREATE TABLE votes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  node_id    UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, node_id)
);

CREATE INDEX idx_votes_node ON votes(node_id);
```

**Notes:**
- When a vote is inserted or deleted, a trigger should increment/decrement `nodes.upvotes`.
- RLS: Users can insert/delete their own votes. Anyone can read vote counts (via the denormalized `nodes.upvotes`).

---

## API Surface (Planned)

These are the server actions or API routes the application will need. They are not yet implemented.

| Endpoint / Action | Method | Description |
|-------------------|--------|-------------|
| `parseRawText` | POST | Accept raw text, return parsed Markdown + metadata |
| `createIngestionDraft` | POST | Create a hidden ingestion envelope for one capture flow |
| `uploadIngestionSource` | POST | Preserve uploaded source files for an ingestion |
| `analyzeIngestion` | POST | Parse/analyze an ingestion into staged `ingestion_items` |
| `updateIngestionItem` | PATCH | Toggle include/exclude and edit staged titles/tags during review |
| `commitIngestion` | POST | Materialize included staged items into artifacts and create artifact links |
| `discardIngestion` | POST | Discard a draft ingestion without committing staged items |
| `listIngestions` | GET | List the user's ingestions and statuses |
| `getIngestion` | GET | Get a single ingestion with its staged items |
| `createTextArtifact` | POST | Save a parsed text artifact to the user's vault |
| `uploadImage` | POST | Upload image to Supabase Storage, create image artifact |
| `createAudioLink` | POST | Validate URL, create audio_link artifact |
| `listArtifacts` | GET | List the current user's artifacts (with search, tag filter, type filter, pagination) |
| `getArtifact` | GET | Get a single artifact by ID |
| `updateArtifact` | PATCH | Update title, tags, description, visibility |
| `deleteArtifact` | DELETE | Soft or hard delete an artifact |
| `listRelatedArtifacts` | GET | List artifacts that are likely related to a given artifact |
| `suggestArtifactLinks` | POST | Recompute or return suggested artifact-to-artifact links from provenance evidence |
| `confirmArtifactLink` | POST | Confirm a suggested artifact relationship |
| `removeArtifactLink` | DELETE | Dismiss or remove an artifact relationship |
| `createNode` | POST | Create a node with linked artifacts and hook text |
| `getNode` | GET | Get a node with its artifacts (ordered by position) |
| `updateNode` | PATCH | Update node metadata, hook, add/remove artifacts |
| `forkNode` | POST | Copy a public node into the current user's vault |
| `listFeed` | GET | Public feed with sort mode (`new`, `hot`, `rabbit_holes`) and pagination |
| `voteNode` | POST | Upvote a public node |
| `unvoteNode` | DELETE | Remove upvote |

**Note:** the artifact-link endpoints now map to the committed `artifact_links` table, while dedicated seed/trace tables remain deferred.

## Output Contract

The parser's output is the most important contract in the system. Any component that consumes parsed content should expect:

**Input:** A raw string of arbitrary length containing copy-pasted LLM output.

**Output:**

```typescript
interface ParseResult {
  parsed_markdown: string;    // Clean Markdown, ready to render
  metadata: {
    source_model?: string;              // e.g. "chatgpt-o3", "claude-3.5-sonnet", "gemini-2"
    source_surface?: string;            // e.g. "chatgpt-web", "claude-web", "gemini-web"
    detected_prompt?: string;           // The user's prompt, if distinguishable from the response
    captured_at?: string;               // ISO timestamp when a reliable source timestamp is detectable
    prompt_fingerprint?: string;        // Exact normalized prompt fingerprint, when available
    prompt_family_fingerprint?: string; // Fuzzy prompt-family grouping, when available
    raw_length: number;                 // Character count of raw input
    parsed_length: number;              // Character count of parsed output
    parser_version: string;             // Semver of the parser that produced this
  };
}
```

The required contract remains `parsed_markdown` plus `raw_length`, `parsed_length`, and `parser_version`. The provenance fields are optional and best-effort.

## Schema Versioning

This schema will evolve. When making changes:

1. Update this document first.
2. Write a Supabase migration file.
3. Note what changed and why in a comment at the top of the migration.
4. Do not drop columns or tables without explicit founder approval.
