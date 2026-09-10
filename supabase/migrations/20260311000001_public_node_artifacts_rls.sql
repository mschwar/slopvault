-- Allow artifacts to be read if they belong to a public node.
-- This ensures public nodes can render their bundled artifacts even if the artifacts are private by default.

CREATE POLICY "Artifacts are viewable if in a public node"
ON artifacts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM node_artifacts
    JOIN nodes ON nodes.id = node_artifacts.node_id
    WHERE node_artifacts.artifact_id = artifacts.id
      AND nodes.visibility = 'public'
  )
);
