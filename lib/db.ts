/**
 * Local SQLite database — single source of truth for all todo data.
 * Replaces Supabase for core data storage.
 *
 * Tables: lists, todos, task_links
 * Images stay in expo-file-system + AsyncStorage (no change).
 */

import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('turbotodo.db');

// ── Init — run once at app startup ──────────────────────────────────────────

export function initDB(): void {
  db.execSync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS lists (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL,
      sort_order  INTEGER NOT NULL DEFAULT 0,
      inserted_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS todos (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      list_id     INTEGER NOT NULL,
      parent_id   INTEGER,
      task        TEXT    NOT NULL,
      note        TEXT,
      is_complete INTEGER NOT NULL DEFAULT 0,
      status      TEXT,
      sort_order  INTEGER NOT NULL DEFAULT 0,
      inserted_at TEXT    NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (list_id)   REFERENCES lists(id)  ON DELETE CASCADE,
      FOREIGN KEY (parent_id) REFERENCES todos(id)  ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS task_links (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      todo_id     INTEGER NOT NULL,
      url         TEXT    NOT NULL,
      name        TEXT,
      sort_order  INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_todos_list_id   ON todos(list_id);
    CREATE INDEX IF NOT EXISTS idx_todos_parent_id ON todos(parent_id);
    CREATE INDEX IF NOT EXISTS idx_links_todo_id   ON task_links(todo_id);
  `);

  try {
    db.execSync('ALTER TABLE todos ADD COLUMN pinned INTEGER NOT NULL DEFAULT 0');
  } catch { /* already exists */ }
  try {
    db.execSync('ALTER TABLE todos ADD COLUMN alarm_time TEXT');
  } catch { /* already exists */ }
  try {
    db.execSync('ALTER TABLE todos ADD COLUMN notification_id TEXT');
  } catch { /* already exists */ }
  try {
    db.execSync('ALTER TABLE todos ADD COLUMN daily_source_list_id INTEGER');
  } catch { /* already exists */ }
  try {
    db.execSync('ALTER TABLE todos ADD COLUMN daily_source_parent_id INTEGER');
  } catch { /* already exists */ }
  try {
    db.execSync('ALTER TABLE todos ADD COLUMN daily_source_sort_order INTEGER');
  } catch { /* already exists */ }
}

export default db;
