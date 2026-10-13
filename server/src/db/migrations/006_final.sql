-- =========================================================================
-- TenderLens — 006_final
-- MFA fields, reports, audit read indexes.
-- =========================================================================

-- ---------- users: MFA ----------
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS mfa_enabled        BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS mfa_secret         TEXT,
  ADD COLUMN IF NOT EXISTS mfa_pending_secret TEXT;

-- ---------- reports ----------
CREATE TABLE IF NOT EXISTS reports (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind          TEXT NOT NULL CHECK (kind IN ('tender_analysis','company','audit')),
  format        TEXT NOT NULL CHECK (format IN ('pdf','csv','xlsx')),
  resource_id   TEXT,
  filename      TEXT NOT NULL,
  storage_key   TEXT,
  mime_type     TEXT NOT NULL,
  size_bytes    BIGINT,
  status        TEXT NOT NULL DEFAULT 'queued'
                CHECK (status IN ('queued','generating','ready','failed')),
  error         TEXT,
  requested_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_reports_requested_by ON reports(requested_by);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at DESC);

-- ---------- audit read helpers ----------
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource
  ON audit_logs(resource_type, resource_id);
