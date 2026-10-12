-- Harden the future SQLite-backed login flow with durable counters.
-- Apply after 0001_admin_cms.sql.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS admin_login_attempts (
  client_key_hash TEXT PRIMARY KEY NOT NULL,
  window_start INTEGER NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  locked_until INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_admin_login_attempts_lock ON admin_login_attempts(locked_until);

-- Allows revocation of all sessions by deleting their hashes from
-- admin_sessions; the auth layer must check this table on every request.
-- Existing stateless sessions are NOT revocable until that layer is implemented.
