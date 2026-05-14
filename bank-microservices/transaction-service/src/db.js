const Database = require('better-sqlite3');
const path     = require('path');
const fs       = require('fs');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, 'transactions.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS transactions (
    id           TEXT PRIMARY KEY,
    from_account TEXT,
    to_account   TEXT,
    amount       REAL NOT NULL,
    type         TEXT NOT NULL DEFAULT 'transfer',
    status       TEXT NOT NULL DEFAULT 'pending',
    description  TEXT,
    created_at   TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_from ON transactions(from_account);
  CREATE INDEX IF NOT EXISTS idx_to   ON transactions(to_account);
  CREATE INDEX IF NOT EXISTS idx_date ON transactions(created_at);
`);

module.exports = db;
