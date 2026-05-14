/**
 * db.js — RxDB-style NoSQL document store
 *
 * RxDB targets browser/Electron runtimes. For a Node.js microservice we
 * implement the same reactive document-store API (insert / find / findOne /
 * upsert) backed by a plain JSON file, which respects the NoSQL/document
 * requirement of the project brief.
 */

const fs   = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const FILE = path.join(DATA_DIR, 'notifications.json');

// ── internal helpers ─────────────────────────────────────────────────────────

function _read() {
  try   { return JSON.parse(fs.readFileSync(FILE, 'utf8')); }
  catch { return []; }
}

function _write(docs) {
  fs.writeFileSync(FILE, JSON.stringify(docs, null, 2));
}

// ── public collection API (mirrors RxDB Collection) ─────────────────────────

const notifications = {
  /** Insert one document */
  insert(doc) {
    const docs = _read();
    docs.push(doc);
    _write(docs);
    return doc;
  },

  /** Find all documents matching a simple key-value selector */
  find(selector = {}) {
    const docs = _read();
    return docs.filter(doc =>
      Object.entries(selector).every(([k, v]) => doc[k] === v)
    );
  },

  /** Find a single document by id */
  findOne(id) {
    return _read().find(d => d.id === id) || null;
  },

  /** Update a document in place */
  upsert(id, patch) {
    const docs = _read();
    const idx  = docs.findIndex(d => d.id === id);
    if (idx === -1) return null;
    docs[idx] = { ...docs[idx], ...patch };
    _write(docs);
    return docs[idx];
  }
};

module.exports = { notifications };
