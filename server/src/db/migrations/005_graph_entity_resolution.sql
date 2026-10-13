-- =========================================================================
-- TenderLens — 005_graph_entity_resolution
-- Graph sync bookkeeping + entity resolution (fuzzy company matches).
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ---------- graph_sync_runs ----------
CREATE TABLE IF NOT EXISTS graph_sync_runs (
  id           BIGSERIAL PRIMARY KEY,
  status       TEXT NOT NULL DEFAULT 'running'
               CHECK (status IN ('running','completed','failed')),
  node_counts  JSONB,
  rel_counts   JSONB,
  error        TEXT,
  started_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_graph_sync_started ON graph_sync_runs(started_at DESC);

-- ---------- entity_matches ----------
-- Represents a possible duplicate company. Company A is always < Company B (UUID order)
-- to keep the pair canonical.
CREATE TABLE IF NOT EXISTS entity_matches (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_a_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  company_b_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  confidence    NUMERIC(5,4) NOT NULL,     -- 0..1
  reasons       JSONB,                     -- { name_sim, reg_sim, address_sim, notes }
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','confirmed','rejected')),
  reviewed_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (company_a_id < company_b_id),
  UNIQUE (company_a_id, company_b_id)
);

CREATE INDEX IF NOT EXISTS idx_entity_matches_status ON entity_matches(status);
CREATE INDEX IF NOT EXISTS idx_entity_matches_confidence ON entity_matches(confidence DESC);

DROP TRIGGER IF EXISTS trg_entity_matches_updated_at ON entity_matches;
CREATE TRIGGER trg_entity_matches_updated_at
BEFORE UPDATE ON entity_matches
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------- trigram index for name search ----------
CREATE INDEX IF NOT EXISTS companies_name_trgm_idx
  ON companies USING gin (LOWER(name) gin_trgm_ops);
