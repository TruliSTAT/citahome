const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DATABASE_PATH ||
  (fs.existsSync('/data') ? '/data/citahome.db' : path.join(__dirname, 'citahome.db'));

const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function initDb() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS properties (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      address_raw   TEXT NOT NULL,
      address_norm  TEXT NOT NULL,
      city          TEXT,
      state         TEXT,
      zip           TEXT,
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_synced   DATETIME
    );
    CREATE INDEX IF NOT EXISTS idx_properties_address ON properties(address_norm);

    CREATE TABLE IF NOT EXISTS service_records (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      property_id     INTEGER REFERENCES properties(id),
      source          TEXT NOT NULL,
      record_type     TEXT NOT NULL,
      trade           TEXT,
      description     TEXT,
      operator_name   TEXT,
      operator_rating REAL,
      permit_number   TEXT,
      permit_status   TEXT,
      service_date    DATE,
      created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
      source_id       TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_sr_property ON service_records(property_id);
    CREATE INDEX IF NOT EXISTS idx_sr_source ON service_records(source);

    CREATE TABLE IF NOT EXISTS report_purchases (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      property_id     INTEGER REFERENCES properties(id),
      email           TEXT NOT NULL,
      stripe_session  TEXT,
      plan            TEXT,
      status          TEXT DEFAULT 'pending',
      purchased_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at      DATETIME,
      access_token    TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_rp_token ON report_purchases(access_token);
    CREATE INDEX IF NOT EXISTS idx_rp_property ON report_purchases(property_id);
  `);

  console.log('[DB] CitaHome database initialized');
  return db;
}

module.exports = { getDb, initDb };
