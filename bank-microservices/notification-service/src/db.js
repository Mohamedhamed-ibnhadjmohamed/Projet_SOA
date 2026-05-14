/**
 * db.js — NoSQL document store (JSON file)
 * Simule une base de données orientée documents (style RxDB / MongoDB)
 * Compatible Node.js sans dépendances natives.
 */

const fs   = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const FILE = path.join(DATA_DIR, 'notifications.json');

function readAll() {
  try   { return JSON.parse(fs.readFileSync(FILE, 'utf8')); }
  catch { return []; }
}

function writeAll(docs) {
  fs.writeFileSync(FILE, JSON.stringify(docs, null, 2));
}

const notifications = {
  insert(doc) {
    const docs = readAll();
    docs.push(doc);
    writeAll(docs);
    return doc;
  },
  find(selector = {}) {
    return readAll().filter(doc =>
      Object.entries(selector).every(([k, v]) => doc[k] === v)
    );
  },
  findOne(id) {
    return readAll().find(d => d.id === id) || null;
  },
  upsert(id, patch) {
    const docs = readAll();
    const idx  = docs.findIndex(d => d.id === id);
    if (idx === -1) return null;
    docs[idx] = { ...docs[idx], ...patch };
    writeAll(docs);
    return docs[idx];
  }
};

module.exports = { notifications };
