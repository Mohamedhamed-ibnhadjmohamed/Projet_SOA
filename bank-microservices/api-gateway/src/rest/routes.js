const { Router } = require('express');
const clients    = require('../grpc-clients');
const router     = Router();

// ════════════════ ACCOUNTS ════════════════════════════════════════════════════

router.post('/accounts', async (req, res) => {
  const { owner, type, balance } = req.body;
  if (!owner || !type) return res.status(400).json({ error: 'owner et type requis' });
  try {
    const r = await clients.accounts.create({ owner, type, balance: balance || 0 });
    if (r.error) return res.status(400).json({ error: r.error });
    res.status(201).json(r);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/accounts', async (req, res) => {
  try {
    const r = await clients.accounts.list({ owner: req.query.owner || '' });
    res.json(r.accounts || []);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/accounts/:id', async (req, res) => {
  try {
    const r = await clients.accounts.get({ id: req.params.id });
    if (r.error) return res.status(404).json({ error: r.error });
    res.json(r);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.patch('/accounts/:id/balance', async (req, res) => {
  const { amount, operation } = req.body;
  if (!amount || !operation) return res.status(400).json({ error: 'amount et operation requis' });
  try {
    const r = await clients.accounts.updateBalance({ id: req.params.id, amount, operation });
    if (r.error) return res.status(400).json({ error: r.error });
    res.json(r);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/accounts/:id', async (req, res) => {
  try {
    const r = await clients.accounts.delete({ id: req.params.id });
    if (!r.success) return res.status(404).json({ error: r.message });
    res.json(r);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ════════════════ TRANSACTIONS ════════════════════════════════════════════════

router.post('/transactions/transfer', async (req, res) => {
  const { from_account, to_account, amount, description } = req.body;
  if (!from_account || !to_account || !amount)
    return res.status(400).json({ error: 'from_account, to_account et amount requis' });
  try {
    const r = await clients.transactions.transfer({ from_account, to_account, amount, description: description || '' });
    if (r.error) return res.status(400).json({ error: r.error });
    res.status(201).json(r);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/transactions', async (req, res) => {
  try {
    const r = await clients.transactions.list({ account_id: req.query.account_id || '' });
    res.json(r.transactions || []);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/transactions/history/:accountId', async (req, res) => {
  try {
    const r = await clients.transactions.history({
      account_id: req.params.accountId,
      date_from:  req.query.date_from || '',
      date_to:    req.query.date_to   || ''
    });
    res.json(r.transactions || []);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/transactions/:id', async (req, res) => {
  try {
    const r = await clients.transactions.get({ id: req.params.id });
    if (r.error) return res.status(404).json({ error: r.error });
    res.json(r);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ════════════════ NOTIFICATIONS ══════════════════════════════════════════════

router.post('/notifications', async (req, res) => {
  const { user_id, type, title, body, account_id } = req.body;
  if (!user_id || !body) return res.status(400).json({ error: 'user_id et body requis' });
  try {
    const r = await clients.notifications.send({ user_id, type: type || 'info', title: title || 'Notification', body, account_id: account_id || '' });
    if (r.error) return res.status(400).json({ error: r.error });
    res.status(201).json(r);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/notifications/:userId', async (req, res) => {
  try {
    const r = await clients.notifications.list({ user_id: req.params.userId });
    res.json(r.notifications || []);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.patch('/notifications/:id/read', async (req, res) => {
  try {
    const r = await clients.notifications.markRead({ id: req.params.id });
    if (r.error) return res.status(404).json({ error: r.error });
    res.json(r);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
