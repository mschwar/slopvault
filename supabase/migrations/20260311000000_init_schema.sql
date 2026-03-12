-- Initialize profiles and artifacts tables.
-- This matches the schema defined in SCHEMA.md.

CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  pseudonym   TEXT UNIQUE NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Handle profile creation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, pseudonym)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'pseudonym', 'ghost_' || substr(new.id::text, 1, 8))
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- RLS: Users can read any profile (pseudonyms are public). Users can only update their own.
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone"
ON profiles FOR SELECT
USING (true);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

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
  metadata         JSONB NOT NULL DEFAULT '{}',   -- short-term home for provenance evidence
  tags             TEXT[] NOT NULL DEFAULT '{}',  -- user-applied tags
  visibility       TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'public')),
  fts              TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(parsed_markdown, '') || ' ' || coalesce(description, ''))
  ) STORED,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_artifacts_user_id ON artifacts(user_id);
CREATE INDEX idx_artifacts_type ON artifacts(type);
CREATE INDEX idx_artifacts_visibility ON artifacts(visibility);
CREATE INDEX idx_artifacts_tags ON artifacts USING GIN(tags);
CREATE INDEX idx_artifacts_fts ON artifacts USING GIN(fts);

-- RLS policies: own data for writes, public data for reads.
ALTER TABLE artifacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Artifacts are viewable by owner or if public"
ON artifacts FOR SELECT
USING (auth.uid() = user_id OR visibility = 'public');

CREATE POLICY "Users can manage own artifacts"
ON artifacts FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

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

-- RLS policies: same pattern as artifacts.
ALTER TABLE nodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Nodes are viewable by owner or if public"
ON nodes FOR SELECT
USING (auth.uid() = user_id OR visibility = 'public');

CREATE POLICY "Users can manage own nodes"
ON nodes FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TABLE node_artifacts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id      UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  artifact_id  UUID NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
  position     INTEGER NOT NULL DEFAULT 0,  -- display order within the node
  UNIQUE(node_id, artifact_id)
);

CREATE INDEX idx_node_artifacts_node ON node_artifacts(node_id);

ALTER TABLE node_artifacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Node artifacts are viewable if node is viewable"
ON node_artifacts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM nodes
    WHERE nodes.id = node_artifacts.node_id
      AND (nodes.user_id = auth.uid() OR nodes.visibility = 'public')
  )
);

CREATE POLICY "Users can manage node artifacts of own nodes"
ON node_artifacts FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM nodes
    WHERE nodes.id = node_artifacts.node_id
      AND nodes.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM nodes
    WHERE nodes.id = node_artifacts.node_id
      AND nodes.user_id = auth.uid()
  )
);

CREATE TABLE votes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  node_id    UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, node_id)
);

CREATE INDEX idx_votes_node ON votes(node_id);

ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Votes are viewable by everyone"
ON votes FOR SELECT
USING (true);

CREATE POLICY "Users can manage own votes"
ON votes FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
