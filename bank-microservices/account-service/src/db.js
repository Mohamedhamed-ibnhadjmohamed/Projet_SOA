const sqlite3 = require('sqlite3').verbose();
const path    = require('path');
const fs      = require('fs');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new sqlite3.Database(path.join(DATA_DIR, 'accounts.db'));

// Initialize schema
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS accounts (
      id         TEXT PRIMARY KEY,
      owner      TEXT NOT NULL,
      type       TEXT NOT NULL DEFAULT 'courant',
      balance    REAL NOT NULL DEFAULT 0,
      status     TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL
    )
  `);
  db.run(`CREATE INDEX IF NOT EXISTS idx_owner ON accounts(owner)`);
});

// ── Promise helpers ───────────────────────────────────────────────────────────

/** Run INSERT / UPDATE / DELETE */
db.runAsync = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this);
    })
  );

/** Fetch one row */
db.getAsync = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)))
  );

/** Fetch all rows */
db.allAsync = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)))
  );

module.exports = db;
