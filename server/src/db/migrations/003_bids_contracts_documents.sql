-- =========================================================================
-- TenderLens — 003_bids_contracts_documents
-- Documents, bids, contracts, contract amendments.
-- =========================================================================

-- ---------- documents ----------
CREATE TABLE IF NOT EXISTS documents (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id      UUID REFERENCES tenders(id) ON DELETE SET NULL,
  original_name  TEXT NOT NULL,
  storage_key    TEXT NOT NULL UNIQUE,
  mime_type      TEXT NOT NULL,
  size_bytes     BIGINT NOT NULL,
  file_hash      TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'uploaded'
                 CHECK (status IN ('uploaded','processing','processed','failed')),
  uploaded_by    UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_tender ON documents (tender_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents (status);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents (uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_hash ON documents (file_hash);

DROP TRIGGER IF EXISTS trg_documents_updated_at ON documents;
CREATE TRIGGER trg_documents_updated_at
BEFORE UPDATE ON documents
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------- bids ----------
CREATE TABLE IF NOT EXISTS bids (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id     UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  amount        NUMERIC(16,2) NOT NULL,
  currency      TEXT NOT NULL DEFAULT 'INR',
  submitted_at  TIMESTAMPTZ NOT NULL,
  status        TEXT NOT NULL DEFAULT 'submitted'
                CHECK (status IN ('submitted','evaluated','awarded','rejected')),
  rank          INTEGER,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tender_id, company_id)
);

CREATE INDEX IF NOT EXISTS idx_bids_tender ON bids (tender_id);
CREATE INDEX IF NOT EXISTS idx_bids_company ON bids (company_id);
CREATE INDEX IF NOT EXISTS idx_bids_amount ON bids (amount);
CREATE INDEX IF NOT EXISTS idx_bids_status ON bids (status);

DROP TRIGGER IF EXISTS trg_bids_updated_at ON bids;
CREATE TRIGGER trg_bids_updated_at
BEFORE UPDATE ON bids
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------- contracts ----------
CREATE TABLE IF NOT EXISTS contracts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_code   TEXT NOT NULL UNIQUE,
  tender_id       UUID REFERENCES tenders(id) ON DELETE SET NULL,
  company_id      UUID REFERENCES companies(id) ON DELETE SET NULL,
  original_value  NUMERIC(16,2) NOT NULL,
  current_value   NUMERIC(16,2) NOT NULL,
  currency        TEXT NOT NULL DEFAULT 'INR',
  start_date      DATE,
  end_date        DATE,
  status          TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active','completed','terminated')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contracts_tender ON contracts (tender_id);
CREATE INDEX IF NOT EXISTS idx_contracts_company ON contracts (company_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts (status);

DROP TRIGGER IF EXISTS trg_contracts_updated_at ON contracts;
CREATE TRIGGER trg_contracts_updated_at
BEFORE UPDATE ON contracts
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------- contract_amendments ----------
CREATE TABLE IF NOT EXISTS contract_amendments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id   UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  amendment_no  INTEGER NOT NULL,
  description   TEXT,
  value_delta   NUMERIC(16,2) NOT NULL DEFAULT 0,
  new_end_date  DATE,
  created_by    UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (contract_id, amendment_no)
);

CREATE INDEX IF NOT EXISTS idx_amendments_contract ON contract_amendments (contract_id);
