const { Router } = require('express');
const clients    = require('../grpc-clients');

const router = Router();

// ════════════════════════════════════════════════════════════════
//  ACCOUNTS
// ════════════════════════════════════════════════════════════════

// POST /api/accounts
router.post('/accounts', async (req, res) => {
  const { owner, type, balance } = req.body;
  if (!owner || !type) return res.status(400).json({ error: 'owner et type requis' });
  try {
    const result = await clients.accounts.create({ owner, type, balance: balance || 0 });
    if (result.error) return res.status(400).json({ error: result.error });
    res.status(201).json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/accounts
router.get('/accounts', async (req, res) => {
  try {
    const result = await clients.accounts.list({ owner: req.query.owner || '' });
    res.json(result.accounts || []);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/accounts/:id
router.get('/accounts/:id', async (req, res) => {
  try {
    const result = await clients.accounts.get({ id: req.params.id });
    if (result.error) return res.status(404).json({ error: result.error });
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PATCH /api/accounts/:id/balance
router.patch('/accounts/:id/balance', async (req, res) => {
  const { amount, operation } = req.body;
  if (!amount || !operation) return res.status(400).json({ error: 'amount et operation requis' });
  try {
    const result = await clients.accounts.updateBalance({ id: req.params.id, amount, operation });
    if (result.error) return res.status(400).json({ error: result.error });
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/accounts/:id
router.delete('/accounts/:id', async (req, res) => {
  try {
    const result = await clients.accounts.delete({ id: req.params.id });
    if (!result.success) return res.status(404).json({ error: result.message });
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ════════════════════════════════════════════════════════════════
//  TRANSACTIONS
// ════════════════════════════════════════════════════════════════

// POST /api/transactions/transfer
router.post('/transactions/transfer', async (req, res) => {
  const { from_account, to_account, amount, description } = req.body;
  if (!from_account || !to_account || !amount)
    return res.status(400).json({ error: 'from_account, to_account et amount requis' });
  try {
    const result = await clients.transactions.transfer({ from_account, to_account, amount, description: description || '' });
    if (result.error) return res.status(400).json({ error: result.error });
    res.status(201).json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/transactions
router.get('/transactions', async (req, res) => {
  try {
    const result = await clients.transactions.list({ account_id: req.query.account_id || '' });
    res.json(result.transactions || []);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/transactions/:id
router.get('/transactions/:id', async (req, res) => {
  try {
    const result = await clients.transactions.get({ id: req.params.id });
    if (result.error) return res.status(404).json({ error: result.error });
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/transactions/history/:accountId
router.get('/transactions/history/:accountId', async (req, res) => {
  try {
    const result = await clients.transactions.history({
      account_id: req.params.accountId,
      date_from:  req.query.date_from || '',
      date_to:    req.query.date_to   || ''
    });
    res.json(result.transactions || []);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ════════════════════════════════════════════════════════════════
//  NOTIFICATIONS
// ════════════════════════════════════════════════════════════════

// POST /api/notifications
router.post('/notifications', async (req, res) => {
  const { user_id, type, title, body, account_id } = req.body;
  if (!user_id || !body) return res.status(400).json({ error: 'user_id et body requis' });
  try {
    const result = await clients.notifications.send({ user_id, type: type || 'info', title: title || 'Notification', body, account_id: account_id || '' });
    if (result.error) return res.status(400).json({ error: result.error });
    res.status(201).json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/notifications/:userId
router.get('/notifications/:userId', async (req, res) => {
  try {
    const result = await clients.notifications.list({ user_id: req.params.userId });
    res.json(result.notifications || []);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PATCH /api/notifications/:id/read
router.patch('/notifications/:id/read', async (req, res) => {
  try {
    const result = await clients.notifications.markRead({ id: req.params.id });
    if (result.error) return res.status(404).json({ error: result.error });
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
