-- =========================================================================
-- TenderLens — 001_init
-- Core identity, auth and audit tables.
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------- roles ----------
CREATE TABLE IF NOT EXISTS roles (
  id           SERIAL PRIMARY KEY,
  name         TEXT NOT NULL UNIQUE,
  description  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------- permissions ----------
CREATE TABLE IF NOT EXISTS permissions (
  id           SERIAL PRIMARY KEY,
  code         TEXT NOT NULL UNIQUE,
  description  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------- role_permissions ----------
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id        INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id  INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- ---------- users ----------
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT NOT NULL,
  password_hash   TEXT NOT NULL,
  full_name       TEXT NOT NULL,
  role_id         INTEGER NOT NULL REFERENCES roles(id),
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_uidx ON users (LOWER(email));

-- ---------- refresh_tokens ----------
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash   TEXT NOT NULL UNIQUE,
  expires_at   TIMESTAMPTZ NOT NULL,
  revoked_at   TIMESTAMPTZ,
  ip           TEXT,
  user_agent   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires ON refresh_tokens(expires_at);

-- ---------- password_resets ----------
CREATE TABLE IF NOT EXISTS password_resets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ,
  ip          TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_resets_user ON password_resets(user_id);

-- ---------- audit_logs ----------
CREATE TABLE IF NOT EXISTS audit_logs (
  id             BIGSERIAL PRIMARY KEY,
  user_id        UUID REFERENCES users(id) ON DELETE SET NULL,
  action         TEXT NOT NULL,
  resource_type  TEXT,
  resource_id    TEXT,
  metadata       JSONB,
  ip             TEXT,
  user_agent     TEXT,
  result         TEXT NOT NULL DEFAULT 'success',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- ---------- updated_at trigger for users ----------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
