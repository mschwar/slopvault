-- Add hidden ingestion envelopes, staged ingestion items, and lightweight artifact links.
-- This keeps the product artifact-first while preserving raw source material and review state.

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

ALTER TABLE ingestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingestion_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE artifact_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own ingestions"
ON ingestions
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own ingestion items"
ON ingestion_items
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM ingestions
    WHERE ingestions.id = ingestion_items.ingestion_id
      AND ingestions.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM ingestions
    WHERE ingestions.id = ingestion_items.ingestion_id
      AND ingestions.user_id = auth.uid()
  )
);

CREATE POLICY "Users manage own artifact links"
ON artifact_links
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

INSERT INTO storage.buckets (id, name, public)
VALUES ('ingestion-sources', 'ingestion-sources', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can read own ingestion source objects"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'ingestion-sources'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can insert own ingestion source objects"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'ingestion-sources'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own ingestion source objects"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'ingestion-sources'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'ingestion-sources'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own ingestion source objects"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'ingestion-sources'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
