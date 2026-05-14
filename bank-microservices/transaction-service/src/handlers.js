const { v4: uuidv4 } = require('uuid');
const grpc           = require('@grpc/grpc-js');
const protoLoader    = require('@grpc/proto-loader');
const path           = require('path');
const db             = require('./db');
const kafka          = require('./kafka-producer');

// ─── gRPC client → account-service ───────────────────────────────────────────
const ACCOUNT_PROTO = path.join(__dirname, '../../account-service/proto/account.proto');
const accountPkg    = grpc.loadPackageDefinition(
  protoLoader.loadSync(ACCOUNT_PROTO, { keepCase: true, longs: String, enums: String, defaults: true, oneofs: true })
).account;

const accountClient = new accountPkg.AccountService(
  process.env.ACCOUNT_HOST || 'localhost:50051',
  grpc.credentials.createInsecure()
);

const rpc = (method, req) =>
  new Promise((resolve, reject) =>
    accountClient[method](req, (err, res) =>
      err ? reject(err) : res.error ? reject(new Error(res.error)) : resolve(res)
    )
  );

// ─── helpers ─────────────────────────────────────────────────────────────────
const ok  = row => ({ ...row, error: '' });
const err = msg => ({ error: msg });

// ─── Transfer ─────────────────────────────────────────────────────────────────
async function transfer(call, callback) {
  const { from_account, to_account, amount, description } = call.request;

  if (!from_account || !to_account || !amount)
    return callback(null, err('from_account, to_account et amount requis'));
  if (amount <= 0)
    return callback(null, err('Le montant doit être positif'));
  if (from_account === to_account)
    return callback(null, err('Source et destination identiques'));

  const id         = uuidv4();
  const created_at = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO transactions (id, from_account, to_account, amount, type, status, description, created_at)
     VALUES (?, ?, ?, ?, 'transfer', 'pending', ?, ?)`,
    [id, from_account, to_account, amount, description || '', created_at]
  );

  try {
    await rpc('updateBalance', { id: from_account, amount, operation: 'debit' });
    await rpc('updateBalance', { id: to_account,   amount, operation: 'credit' });

    await db.runAsync(`UPDATE transactions SET status = 'completed' WHERE id = ?`, [id]);

    await kafka.publish('transfer-completed', {
      event: 'TRANSFER_COMPLETED', txId: id, fromAccount: from_account,
      toAccount: to_account, amount, timestamp: created_at
    });

    const tx = await db.getAsync(`SELECT * FROM transactions WHERE id = ?`, [id]);
    callback(null, ok(tx));
  } catch (e) {
    await db.runAsync(`UPDATE transactions SET status = 'failed' WHERE id = ?`, [id]);

    await kafka.publish('transfer-failed', {
      event: 'TRANSFER_FAILED', txId: id, fromAccount: from_account,
      reason: e.message, timestamp: new Date().toISOString()
    });

    callback(null, err(e.message));
  }
}

// ─── GetTransaction ───────────────────────────────────────────────────────────
async function getTransaction(call, callback) {
  try {
    const tx = await db.getAsync(`SELECT * FROM transactions WHERE id = ?`, [call.request.id]);
    if (!tx) return callback(null, err('Transaction introuvable'));
    callback(null, ok(tx));
  } catch (e) {
    callback(null, err(e.message));
  }
}

// ─── ListTransactions ─────────────────────────────────────────────────────────
async function listTransactions(call, callback) {
  try {
    const { account_id } = call.request;
    const rows = account_id
      ? await db.allAsync(
          `SELECT * FROM transactions WHERE from_account = ? OR to_account = ? ORDER BY created_at DESC`,
          [account_id, account_id]
        )
      : await db.allAsync(`SELECT * FROM transactions ORDER BY created_at DESC`);
    callback(null, { transactions: rows, error: '' });
  } catch (e) {
    callback(null, { transactions: [], error: e.message });
  }
}

// ─── GetHistory ───────────────────────────────────────────────────────────────
async function getHistory(call, callback) {
  try {
    const { account_id, date_from, date_to } = call.request;
    let rows;
    if (date_from && date_to) {
      rows = await db.allAsync(
        `SELECT * FROM transactions
         WHERE (from_account = ? OR to_account = ?) AND created_at BETWEEN ? AND ?
         ORDER BY created_at DESC`,
        [account_id, account_id, date_from, date_to]
      );
    } else {
      rows = await db.allAsync(
        `SELECT * FROM transactions WHERE from_account = ? OR to_account = ?
         ORDER BY created_at DESC LIMIT 100`,
        [account_id, account_id]
      );
    }
    callback(null, { transactions: rows, error: '' });
  } catch (e) {
    callback(null, { transactions: [], error: e.message });
  }
}

module.exports = { transfer, getTransaction, listTransactions, getHistory };
