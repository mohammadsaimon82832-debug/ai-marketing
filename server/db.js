import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

const dataDir = path.join(process.cwd(), 'data');
fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'agency.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS organizations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    organization_id INTEGER DEFAULT 1,
    name TEXT NOT NULL,
    industry TEXT,
    website TEXT,
    contact_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    target_audience TEXT,
    brand_voice TEXT,
    preferred_language TEXT,
    services TEXT,
    marketing_goals TEXT,
    brand_guidelines TEXT,
    status TEXT DEFAULT 'active',
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
  );

  CREATE TABLE IF NOT EXISTS campaigns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    objective TEXT,
    target_audience TEXT,
    platforms TEXT,
    budget REAL DEFAULT 0,
    status TEXT DEFAULT 'draft',
    start_date TEXT,
    due_date TEXT,
    description TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id)
  );

  CREATE TABLE IF NOT EXISTS content_pieces (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    platform TEXT,
    tone TEXT,
    language TEXT,
    status TEXT DEFAULT 'draft',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id)
  );

  CREATE TABLE IF NOT EXISTS lead_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER,
    name TEXT NOT NULL,
    company TEXT,
    email TEXT,
    status TEXT DEFAULT 'new',
    source TEXT,
    score INTEGER DEFAULT 0,
    next_action TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id)
  );

  CREATE TABLE IF NOT EXISTS ai_activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_name TEXT NOT NULL,
    input_prompt TEXT,
    output_text TEXT,
    model_name TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

const insertOrg = db.prepare(`
  INSERT OR IGNORE INTO organizations (id, name, slug)
  VALUES (1, 'Northstar Growth Studio', 'northstar-growth-studio')
`);
insertOrg.run();

export { db };
