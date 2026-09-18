-- =========================================================================
-- TenderLens — 002_procurement_core
-- Departments, locations, companies, projects, tenders.
-- =========================================================================

-- ---------- departments ----------
CREATE TABLE IF NOT EXISTS departments (
  id          SERIAL PRIMARY KEY,
  code        TEXT UNIQUE,
  name        TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------- locations ----------
CREATE TABLE IF NOT EXISTS locations (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  state      TEXT,
  country    TEXT NOT NULL DEFAULT 'India',
  latitude   NUMERIC(9,6),
  longitude  NUMERIC(9,6),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (name, state)
);

-- ---------- companies ----------
CREATE TABLE IF NOT EXISTS companies (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  registration_id  TEXT,
  industry         TEXT,
  location_id      INTEGER REFERENCES locations(id) ON DELETE SET NULL,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS companies_name_lower_uidx ON companies (LOWER(name));
CREATE INDEX IF NOT EXISTS idx_companies_registration ON companies (registration_id);
CREATE INDEX IF NOT EXISTS idx_companies_location ON companies (location_id);

DROP TRIGGER IF EXISTS trg_companies_updated_at ON companies;
CREATE TRIGGER trg_companies_updated_at
BEFORE UPDATE ON companies
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------- projects ----------
CREATE TABLE IF NOT EXISTS projects (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code          TEXT UNIQUE,
  name          TEXT NOT NULL,
  description   TEXT,
  location_id   INTEGER REFERENCES locations(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------- tenders ----------
CREATE TABLE IF NOT EXISTS tenders (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_code       TEXT NOT NULL UNIQUE,
  title             TEXT NOT NULL,
  description       TEXT,
  department_id     INTEGER REFERENCES departments(id) ON DELETE SET NULL,
  location_id       INTEGER REFERENCES locations(id) ON DELETE SET NULL,
  project_id        UUID REFERENCES projects(id) ON DELETE SET NULL,
  estimated_value   NUMERIC(16,2),
  currency          TEXT NOT NULL DEFAULT 'INR',
  status            TEXT NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open','evaluation','awarded','completed','cancelled')),
  published_at      TIMESTAMPTZ,
  deadline_at       TIMESTAMPTZ,
  created_by        UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenders_status ON tenders (status);
CREATE INDEX IF NOT EXISTS idx_tenders_department ON tenders (department_id);
CREATE INDEX IF NOT EXISTS idx_tenders_location ON tenders (location_id);
CREATE INDEX IF NOT EXISTS idx_tenders_published ON tenders (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_tenders_deadline ON tenders (deadline_at);
CREATE INDEX IF NOT EXISTS idx_tenders_estimated_value ON tenders (estimated_value);

DROP TRIGGER IF EXISTS trg_tenders_updated_at ON tenders;
CREATE TRIGGER trg_tenders_updated_at
BEFORE UPDATE ON tenders
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
