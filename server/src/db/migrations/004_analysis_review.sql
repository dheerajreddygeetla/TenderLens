-- =========================================================================
-- TenderLens — 004_analysis_review
-- Document chunks, analysis runs, review indicators, notes, notifications.
-- =========================================================================

-- ---------- document_chunks ----------
CREATE TABLE IF NOT EXISTS document_chunks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id  UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  chunk_index  INTEGER NOT NULL,
  content      TEXT NOT NULL,
  char_count   INTEGER NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (document_id, chunk_index)
);

CREATE INDEX IF NOT EXISTS idx_chunks_document ON document_chunks(document_id);

-- ---------- analysis_runs ----------
CREATE TABLE IF NOT EXISTS analysis_runs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id      UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
  run_by         UUID REFERENCES users(id) ON DELETE SET NULL,
  status         TEXT NOT NULL DEFAULT 'running'
                 CHECK (status IN ('running','completed','failed')),
  model_name     TEXT,
  model_version  TEXT,
  features       JSONB,
  summary        JSONB,
  error          TEXT,
  started_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_runs_tender ON analysis_runs(tender_id);
CREATE INDEX IF NOT EXISTS idx_runs_status ON analysis_runs(status);
CREATE INDEX IF NOT EXISTS idx_runs_started ON analysis_runs(started_at DESC);

-- ---------- review_indicators ----------
CREATE TABLE IF NOT EXISTS review_indicators (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id       UUID REFERENCES tenders(id) ON DELETE CASCADE,
  company_id      UUID REFERENCES companies(id) ON DELETE SET NULL,
  document_id     UUID REFERENCES documents(id) ON DELETE SET NULL,
  analysis_run_id UUID REFERENCES analysis_runs(id) ON DELETE SET NULL,
  type            TEXT NOT NULL,
  severity        TEXT NOT NULL CHECK (severity IN ('low','medium','high')),
  title           TEXT NOT NULL,
  evidence        JSONB,
  explanation     TEXT,
  model           TEXT,
  model_version   TEXT,
  status          TEXT NOT NULL DEFAULT 'new'
                  CHECK (status IN ('new','under_review','resolved','dismissed')),
  assigned_to     UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_indicators_tender ON review_indicators(tender_id);
CREATE INDEX IF NOT EXISTS idx_indicators_company ON review_indicators(company_id);
CREATE INDEX IF NOT EXISTS idx_indicators_status ON review_indicators(status);
CREATE INDEX IF NOT EXISTS idx_indicators_severity ON review_indicators(severity);
CREATE INDEX IF NOT EXISTS idx_indicators_type ON review_indicators(type);
CREATE INDEX IF NOT EXISTS idx_indicators_created ON review_indicators(created_at DESC);

DROP TRIGGER IF EXISTS trg_indicators_updated_at ON review_indicators;
CREATE TRIGGER trg_indicators_updated_at
BEFORE UPDATE ON review_indicators
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------- review_notes ----------
CREATE TABLE IF NOT EXISTS review_notes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  indicator_id UUID NOT NULL REFERENCES review_indicators(id) ON DELETE CASCADE,
  author_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  body         TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notes_indicator ON review_notes(indicator_id);

-- ---------- notifications ----------
CREATE TABLE IF NOT EXISTS notifications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
  kind         TEXT NOT NULL,
  title        TEXT NOT NULL,
  body         TEXT,
  resource_type TEXT,
  resource_id  TEXT,
  read_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
