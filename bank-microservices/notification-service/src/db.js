const fs   = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_FILE = path.join(DATA_DIR, 'notifications.json');

function load() {
  try { return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); }
  catch { return []; }
}

function save(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

const notifications = {
  insert(doc) {
    const data = load();
    data.push(doc);
    save(data);
    return doc;
  },
  find(query = {}) {
    const data = load();
    return data.filter(doc =>
      Object.entries(query).every(([k, v]) => doc[k] === v)
    );
  },
  upsert(id, update) {
    const data = load();
    const idx  = data.findIndex(d => d.id === id);
    if (idx === -1) return null;
    data[idx] = { ...data[idx], ...update };
    save(data);
    return data[idx];
  }
};

module.exports = { notifications };
