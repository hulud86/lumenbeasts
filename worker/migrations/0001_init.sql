-- Lumen Beasts cloud saves: accounts, sign-in sessions and one save per account
CREATE TABLE IF NOT EXISTS users (
  id          TEXT PRIMARY KEY,
  google_sub  TEXT UNIQUE,          -- Google account id (null for code-only accounts)
  email       TEXT,
  name        TEXT,
  code_hash   TEXT UNIQUE,          -- SHA-256 of the account code (null if none issued)
  created_at  INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash  TEXT PRIMARY KEY,     -- SHA-256 of the session token; the token itself is never stored
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  INTEGER NOT NULL,
  expires_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id);
CREATE TABLE IF NOT EXISTS saves (
  user_id     TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  data        TEXT NOT NULL,        -- the game's own signed save string
  version     INTEGER NOT NULL,     -- bumps on every write; used to catch edits from two devices
  updated_at  INTEGER NOT NULL
);
