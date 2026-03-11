# SCHEMA.md — SlopVault Data Model

## Overview

SlopVault uses Supabase (Postgres) as its primary data store. This document defines the canonical schema. All implementation work must conform to this schema or explicitly propose changes here before diverging.

The schema is designed for the full MVP (Phases 0-4). Not all tables need to be created at once — create them as features require them.

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

The core content table. Each row is a single parsed AI-generated artifact.

```sql
CREATE TABLE artifacts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title            TEXT,                          -- auto-generated or user-edited
  type             TEXT NOT NULL DEFAULT 'text',  -- 'text' for MVP; later: 'image', 'audio_link'
  raw_content      TEXT NOT NULL,                 -- the original pasted input, preserved as-is
  parsed_markdown  TEXT NOT NULL,                 -- cleaned Markdown output from the parser
  metadata         JSONB NOT NULL DEFAULT '{}',   -- see metadata schema below
  tags             TEXT[] NOT NULL DEFAULT '{}',  -- user-applied tags
  visibility       TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'public')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_artifacts_user_id ON artifacts(user_id);
CREATE INDEX idx_artifacts_visibility ON artifacts(visibility);
CREATE INDEX idx_artifacts_tags ON artifacts USING GIN(tags);
CREATE INDEX idx_artifacts_fts ON artifacts USING GIN(
  to_tsvector('english', coalesce(title, '') || ' ' || parsed_markdown)
);
```

**metadata JSONB structure:**

```json
{
  "source_model": "chatgpt-o3",
  "detected_prompt": "What percentage of world GDP relies on semiconductors?",
  "raw_length": 4523,
  "parsed_length": 3891,
  "parser_version": "0.1.0"
}
```

Fields in `metadata` are optional and best-effort. The parser populates what it can detect. Unknown fields are omitted rather than set to null.

**RLS policies:**
- SELECT: Users can read their own artifacts (any visibility) + anyone can read `visibility = 'public'` artifacts.
- INSERT/UPDATE/DELETE: Users can only modify their own artifacts.

---

### nodes

A bundle of related artifacts, representing a project or idea.

```sql
CREATE TABLE nodes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT,
  parent_node_id  UUID REFERENCES nodes(id) ON DELETE SET NULL,  -- fork lineage
  visibility      TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'public')),
  upvotes         INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_nodes_user_id ON nodes(user_id);
CREATE INDEX idx_nodes_visibility ON nodes(visibility);
CREATE INDEX idx_nodes_parent ON nodes(parent_node_id);
```

**Notes:**
- `parent_node_id` is the fork lineage pointer. NULL means this is an original node. Non-null means it was forked from another node.
- `upvotes` is denormalized for query performance on the feed. The `votes` table is the source of truth.

**RLS policies:** Same pattern as artifacts — own data for writes, public data for reads.

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
| `createArtifact` | POST | Save a parsed artifact to the user's vault |
| `listArtifacts` | GET | List the current user's artifacts (with search, tag filter, pagination) |
| `getArtifact` | GET | Get a single artifact by ID |
| `updateArtifact` | PATCH | Update title, tags, visibility |
| `deleteArtifact` | DELETE | Soft or hard delete an artifact |
| `createNode` | POST | Create a node with linked artifacts |
| `getNode` | GET | Get a node with its artifacts |
| `updateNode` | PATCH | Update node metadata, add/remove artifacts |
| `forkNode` | POST | Copy a public node into the current user's vault |
| `listFeed` | GET | Public feed with sort (new/hot) and pagination |
| `voteNode` | POST | Upvote a public node |
| `unvoteNode` | DELETE | Remove upvote |

## Output Contract

The parser's output is the most important contract in the system. Any component that consumes parsed content should expect:

**Input:** A raw string of arbitrary length containing copy-pasted LLM output.

**Output:**

```typescript
interface ParseResult {
  parsed_markdown: string;    // Clean Markdown, ready to render
  metadata: {
    source_model?: string;    // e.g. "chatgpt-o3", "claude-3.5-sonnet", "gemini-2"
    detected_prompt?: string; // The user's prompt, if distinguishable from the response
    raw_length: number;       // Character count of raw input
    parsed_length: number;    // Character count of parsed output
    parser_version: string;   // Semver of the parser that produced this
  };
}
```

## Schema Versioning

This schema will evolve. When making changes:

1. Update this document first.
2. Write a Supabase migration file.
3. Note what changed and why in a comment at the top of the migration.
4. Do not drop columns or tables without explicit founder approval.
