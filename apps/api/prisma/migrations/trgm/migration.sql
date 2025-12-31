CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX "Participation_metadata_trgm_idx"
  ON "Participation"
  USING GIN ((metadata::text) gin_trgm_ops);
