import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';

/**
 * SQLite persistence via sql.js (WebAssembly SQLite).
 *
 * Chosen because it needs no native compilation: the exact same engine runs in
 * development and in the deployed container. The database lives in a real
 * SQLite file on disk (data/rifq.db) and is written atomically after every
 * mutation, so records survive restarts and redeploys that keep the volume.
 */
const require = createRequire(import.meta.url);
const initSqlJs = require('sql.js');

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'data', 'rifq.db');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const SQL = await initSqlJs({
  locateFile: (file) => path.join(path.dirname(require.resolve('sql.js')), file),
});

const existing = fs.existsSync(DB_PATH) ? fs.readFileSync(DB_PATH) : null;
const raw = existing ? new SQL.Database(existing) : new SQL.Database();

/* ------------------------------ persistence ------------------------------ */

let saveTimer = null;
let dirty = false;

function writeNow() {
  if (!dirty) return;
  dirty = false;
  const bytes = Buffer.from(raw.export());
  const tmp = `${DB_PATH}.tmp`;
  fs.writeFileSync(tmp, bytes);
  fs.renameSync(tmp, DB_PATH);
}

function scheduleSave() {
  dirty = true;
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try {
      writeNow();
    } catch (err) {
      console.error('[db] save failed:', err.message);
    }
  }, 120);
  if (typeof saveTimer.unref === 'function') saveTimer.unref();
}

function flushAndExit(code) {
  try {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = null;
    dirty = true;
    writeNow();
  } catch {
    /* ignore */
  }
  process.exit(code);
}
process.on('SIGINT', () => flushAndExit(0));
process.on('SIGTERM', () => flushAndExit(0));
process.on('beforeExit', () => {
  try {
    writeNow();
  } catch {
    /* ignore */
  }
});

/* --------------------------- better-sqlite3-ish API ---------------------- */

class Statement {
  constructor(sql) {
    this.sql = sql;
  }

  all(...params) {
    const stmt = raw.prepare(this.sql);
    try {
      if (params.length) stmt.bind(params);
      const rows = [];
      while (stmt.step()) rows.push(stmt.getAsObject());
      return rows;
    } finally {
      stmt.free();
    }
  }

  get(...params) {
    return this.all(...params)[0];
  }

  run(...params) {
    const stmt = raw.prepare(this.sql);
    try {
      if (params.length) stmt.bind(params);
      stmt.step();
    } finally {
      stmt.free();
    }
    const changes = raw.getRowsModified();
    let lastInsertRowid = null;
    try {
      const res = raw.exec('SELECT last_insert_rowid() AS id');
      lastInsertRowid = res[0]?.values?.[0]?.[0] ?? null;
    } catch {
      lastInsertRowid = null;
    }
    scheduleSave();
    return { changes, lastInsertRowid };
  }
}

export const db = {
  prepare: (sql) => new Statement(sql),
  exec: (sql) => {
    raw.run(sql);
    scheduleSave();
  },
  run: (sql, params) => {
    raw.run(sql, params);
    scheduleSave();
  },
  raw,
  flush: () => writeNow(),
};

db.exec(`
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  pass_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  verified INTEGER NOT NULL DEFAULT 0,
  verify_token TEXT,
  reset_token TEXT,
  reset_exp INTEGER,
  lang TEXT NOT NULL DEFAULT 'en',
  theme TEXT NOT NULL DEFAULT 'dark',
  prefs TEXT NOT NULL DEFAULT '{}',
  banned INTEGER NOT NULL DEFAULT 0,
  token_version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  last_login TEXT
);

CREATE TABLE IF NOT EXISTS bookmarks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  ref TEXT NOT NULL,
  surah INTEGER,
  ayah INTEGER,
  label TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  UNIQUE(user_id, kind, ref)
);

CREATE TABLE IF NOT EXISTS tasbih (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  dhikr TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  target INTEGER NOT NULL DEFAULT 33,
  day TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(user_id, dhikr, day)
);

CREATE TABLE IF NOT EXISTS tracker (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  day TEXT NOT NULL,
  prayers TEXT NOT NULL DEFAULT '{}',
  quran_pages INTEGER NOT NULL DEFAULT 0,
  dhikr INTEGER NOT NULL DEFAULT 0,
  fasting INTEGER NOT NULL DEFAULT 0,
  deeds TEXT NOT NULL DEFAULT '{}',
  UNIQUE(user_id, day)
);

CREATE TABLE IF NOT EXISTS quiz_results (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  category TEXT NOT NULL,
  score INTEGER NOT NULL,
  total INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  author TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'published',
  likes INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS post_likes (
  post_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  post_id TEXT,
  reporter_id TEXT,
  reporter_email TEXT,
  reason TEXT NOT NULL,
  created_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open'
);

CREATE TABLE IF NOT EXISTS blocks (
  user_id TEXT NOT NULL,
  blocked_user_id TEXT NOT NULL,
  PRIMARY KEY (user_id, blocked_user_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  subject TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL,
  created_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  email_delivered INTEGER NOT NULL DEFAULT 0,
  email_note TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS audit (
  id TEXT PRIMARY KEY,
  actor_id TEXT,
  actor_email TEXT,
  action TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS broadcasts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  audience TEXT NOT NULL DEFAULT 'all',
  admin_id TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_tracker_user ON tracker(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit(created_at);
`);

export const newId = () => crypto.randomUUID();
export const nowIso = () => new Date().toISOString();

export function getSetting(key, fallback = null) {
  const row = db.prepare('SELECT value FROM app_settings WHERE key = ?').get(key);
  return row ? row.value : fallback;
}

export function setSetting(key, value) {
  db.prepare(
    'INSERT INTO app_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
  ).run(key, String(value));
}

export function auditLog(actor, action, detail = '') {
  db.prepare('INSERT INTO audit (id, actor_id, actor_email, action, detail, created_at) VALUES (?,?,?,?,?,?)').run(
    newId(),
    actor?.id || null,
    actor?.email || null,
    action,
    typeof detail === 'string' ? detail : JSON.stringify(detail),
    nowIso()
  );
}

export function publicUser(row) {
  if (!row) return null;
  let prefs = {};
  try {
    prefs = JSON.parse(row.prefs || '{}');
  } catch {
    prefs = {};
  }
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    verified: !!row.verified,
    lang: row.lang,
    theme: row.theme,
    prefs,
    createdAt: row.created_at,
    lastLogin: row.last_login,
  };
}
