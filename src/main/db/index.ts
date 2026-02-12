import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'
import * as schema from './schema'

let db: ReturnType<typeof drizzle<typeof schema>>

export function getDb() {
  if (db) return db

  const userDataPath = app.getPath('userData')
  if (!existsSync(userDataPath)) {
    mkdirSync(userDataPath, { recursive: true })
  }

  const dbPath = join(userDataPath, 'research-reach.db')
  const sqlite = new Database(dbPath)

  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')

  // Create tables
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS profile (
      id INTEGER PRIMARY KEY DEFAULT 1,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      university TEXT,
      department TEXT,
      research_interests TEXT,
      cv_path TEXT,
      cv_text TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS searches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      university_name TEXT NOT NULL,
      keywords TEXT NOT NULL,
      department_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS professors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      search_id INTEGER REFERENCES searches(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      title TEXT,
      department TEXT,
      profile_url TEXT,
      email TEXT,
      research_summary TEXT,
      image_url TEXT,
      relevance_score REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS papers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      professor_id INTEGER REFERENCES professors(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      authors TEXT,
      abstract TEXT,
      url TEXT,
      year INTEGER,
      source TEXT,
      relevance_score REAL,
      ai_summary TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      professor_id INTEGER REFERENCES professors(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      role TEXT,
      email TEXT,
      profile_url TEXT,
      is_recommended_contact BOOLEAN DEFAULT 0,
      recommendation_reason TEXT
    );

    CREATE TABLE IF NOT EXISTS emails (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      professor_id INTEGER REFERENCES professors(id) ON DELETE CASCADE,
      contact_id INTEGER REFERENCES contacts(id),
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      recipient_email TEXT,
      status TEXT DEFAULT 'draft',
      work_period TEXT,
      selected_papers TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      sent_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `)

  db = drizzle(sqlite, { schema })
  return db
}
