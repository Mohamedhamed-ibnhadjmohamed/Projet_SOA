const { v4: uuidv4 } = require('uuid');
const db             = require('./db');

// ─── helpers ────────────────────────────────────────────────────────────────
const ok  = (row)  => ({ ...row, error: '' });
const err = (msg)  => ({ error: msg });

// ─── handlers ───────────────────────────────────────────────────────────────

function createAccount(call, callback, publish) {
  try {
    const { owner, type, balance } = call.request;

    if (!owner || !type)    return callback(null, err('owner et type requis'));
    if ((balance || 0) < 0) return callback(null, err('Le solde initial ne peut pas être négatif'));

    const id         = uuidv4();
    const created_at = new Date().toISOString();

    db.prepare(`
      INSERT INTO accounts (id, owner, type, balance, status, created_at)
      VALUES (?, ?, ?, ?, 'active', ?)
    `).run(id, owner, type, balance || 0, created_at);

    const account = db.prepare('SELECT * FROM accounts WHERE id = ?').get(id);

    publish('account-created', {
      event:     'ACCOUNT_CREATED',
      accountId: id,
      owner,
      balance:   balance || 0,
      timestamp: created_at
    });

    callback(null, ok(account));
  } catch (e) {
    console.error('[account-service] createAccount:', e.message);
    callback(null, err(e.message));
  }
}

function getAccount(call, callback) {
  try {
    const account = db.prepare('SELECT * FROM accounts WHERE id = ?').get(call.request.id);
    if (!account) return callback(null, err('Compte introuvable'));
    callback(null, ok(account));
  } catch (e) {
    callback(null, err(e.message));
  }
}

function listAccounts(call, callback) {
  try {
    const { owner } = call.request;
    const accounts = owner
      ? db.prepare('SELECT * FROM accounts WHERE owner = ? ORDER BY created_at DESC').all(owner)
      : db.prepare('SELECT * FROM accounts ORDER BY created_at DESC').all();
    callback(null, { accounts, error: '' });
  } catch (e) {
    callback(null, { accounts: [], error: e.message });
  }
}

function updateBalance(call, callback, publish) {
  try {
    const { id, amount, operation } = call.request;
    const account = db.prepare('SELECT * FROM accounts WHERE id = ?').get(id);

    if (!account)                return callback(null, err('Compte introuvable'));
    if (account.status !== 'active') return callback(null, err('Compte inactif'));
    if (!['credit','debit'].includes(operation)) return callback(null, err('Opération invalide (credit | debit)'));

    let newBalance;
    if (operation === 'credit') {
      newBalance = account.balance + amount;
    } else {
      if (account.balance < amount) return callback(null, err('Solde insuffisant'));
      newBalance = account.balance - amount;
    }

    db.prepare('UPDATE accounts SET balance = ? WHERE id = ?').run(newBalance, id);
    const updated = db.prepare('SELECT * FROM accounts WHERE id = ?').get(id);

    publish('balance-updated', {
      event:      'BALANCE_UPDATED',
      accountId:  id,
      operation,
      amount,
      newBalance,
      timestamp:  new Date().toISOString()
    });

    callback(null, ok(updated));
  } catch (e) {
    callback(null, err(e.message));
  }
}

function deleteAccount(call, callback, publish) {
  try {
    const { id } = call.request;
    const account = db.prepare('SELECT * FROM accounts WHERE id = ?').get(id);
    if (!account) return callback(null, { success: false, message: 'Compte introuvable' });

    db.prepare("UPDATE accounts SET status = 'closed' WHERE id = ?").run(id);

    publish('account-closed', {
      event:     'ACCOUNT_CLOSED',
      accountId: id,
      timestamp: new Date().toISOString()
    });

    callback(null, { success: true, message: 'Compte fermé avec succès' });
  } catch (e) {
    callback(null, { success: false, message: e.message });
  }
}

module.exports = { createAccount, getAccount, listAccounts, updateBalance, deleteAccount };
