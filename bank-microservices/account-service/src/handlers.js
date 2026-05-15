const { v4: uuidv4 } = require('uuid');
const db             = require('./db');

const ok  = row => ({ ...row, error: '' });
const err = msg => ({ error: msg });

async function createAccount(call, callback, publish) {
  try {
    const { owner, type, balance } = call.request;
    if (!owner || !type)     return callback(null, err('owner et type requis'));
    if ((balance || 0) < 0) return callback(null, err('Le solde initial ne peut pas être négatif'));

    const id         = uuidv4();
    const created_at = new Date().toISOString();
    const bal        = balance || 0;

    await db.runAsync(
      `INSERT INTO accounts (id, owner, type, balance, status, created_at) VALUES (?, ?, ?, ?, 'active', ?)`,
      [id, owner, type, bal, created_at]
    );
    const account = await db.getAsync(`SELECT * FROM accounts WHERE id = ?`, [id]);

    await publish('account-created', {
      event: 'ACCOUNT_CREATED', accountId: id, owner, balance: bal, timestamp: created_at
    });

    callback(null, ok(account));
  } catch (e) {
    callback(null, err(e.message));
  }
}

async function getAccount(call, callback) {
  try {
    const account = await db.getAsync(`SELECT * FROM accounts WHERE id = ?`, [call.request.id]);
    if (!account) return callback(null, err('Compte introuvable'));
    callback(null, ok(account));
  } catch (e) {
    callback(null, err(e.message));
  }
}

async function listAccounts(call, callback) {
  try {
    const { owner } = call.request;
    const accounts = owner
      ? await db.allAsync(`SELECT * FROM accounts WHERE owner = ? ORDER BY created_at DESC`, [owner])
      : await db.allAsync(`SELECT * FROM accounts ORDER BY created_at DESC`);
    callback(null, { accounts, error: '' });
  } catch (e) {
    callback(null, { accounts: [], error: e.message });
  }
}

async function updateBalance(call, callback, publish) {
  try {
    const { id, amount, operation } = call.request;
    const account = await db.getAsync(`SELECT * FROM accounts WHERE id = ?`, [id]);

    if (!account)                    return callback(null, err('Compte introuvable'));
    if (account.status !== 'active') return callback(null, err('Compte inactif'));
    if (!['credit','debit'].includes(operation))
                                     return callback(null, err('Opération invalide'));

    let newBalance;
    if (operation === 'credit') {
      newBalance = account.balance + amount;
    } else {
      if (account.balance < amount) return callback(null, err('Solde insuffisant'));
      newBalance = account.balance - amount;
    }

    await db.runAsync(`UPDATE accounts SET balance = ? WHERE id = ?`, [newBalance, id]);
    const updated = await db.getAsync(`SELECT * FROM accounts WHERE id = ?`, [id]);

    await publish('balance-updated', {
      event: 'BALANCE_UPDATED', accountId: id, operation, amount, newBalance,
      timestamp: new Date().toISOString()
    });

    callback(null, ok(updated));
  } catch (e) {
    callback(null, err(e.message));
  }
}

async function deleteAccount(call, callback, publish) {
  try {
    const { id } = call.request;
    const account = await db.getAsync(`SELECT * FROM accounts WHERE id = ?`, [id]);
    if (!account) return callback(null, { success: false, message: 'Compte introuvable' });

    await db.runAsync(`UPDATE accounts SET status = 'closed' WHERE id = ?`, [id]);

    await publish('account-closed', {
      event: 'ACCOUNT_CLOSED', accountId: id, timestamp: new Date().toISOString()
    });

    callback(null, { success: true, message: 'Compte fermé avec succès' });
  } catch (e) {
    callback(null, { success: false, message: e.message });
  }
}

module.exports = { createAccount, getAccount, listAccounts, updateBalance, deleteAccount };