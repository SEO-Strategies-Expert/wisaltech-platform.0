// db.js — طبقة قاعدة البيانات (better-sqlite3) + جداول المصادقة والصلاحيات
const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'wisaltech.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── جداول النظام (المصادقة، الصلاحيات، الربط، التدقيق) ──
db.exec(`
CREATE TABLE IF NOT EXISTS users(
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'member',   -- owner | admin | member | client
  client_id     INTEGER,                          -- مطلوب لمستخدمي البورتال (العملاء)
  email_verified INTEGER DEFAULT 0,
  verify_token  TEXT,
  reset_token   TEXT,
  reset_expires INTEGER,
  created_at    TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(client_id) REFERENCES clients(id)
);

CREATE TABLE IF NOT EXISTS oauth_connections(
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  provider     TEXT NOT NULL,          -- meta | google | whatsapp | instagram | email
  account_name TEXT,
  status       TEXT DEFAULT 'pending', -- pending | connected | verified | error
  scopes       TEXT,
  client_id    INTEGER,                -- NULL = على مستوى الوكالة
  connected_by INTEGER,
  access_token TEXT,                   -- (في الإنتاج: مشفّر/في مخزن أسرار)
  refresh_token TEXT,
  expires_at   INTEGER,
  created_at   TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(client_id) REFERENCES clients(id),
  FOREIGN KEY(connected_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS audit_log(
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id   INTEGER,
  action    TEXT,
  entity    TEXT,
  meta      TEXT,
  ts        TEXT DEFAULT (datetime('now'))
);
`);

function audit(userId, action, entity, meta) {
  try {
    db.prepare('INSERT INTO audit_log(user_id,action,entity,meta) VALUES(?,?,?,?)')
      .run(userId || null, action, entity || null, meta ? JSON.stringify(meta) : null);
  } catch (e) { /* لا نُفشل الطلب بسبب التدقيق */ }
}

module.exports = { db, audit };
