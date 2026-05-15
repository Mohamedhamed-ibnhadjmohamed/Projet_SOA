const { Router } = require('express');
const grpcClients = require('../grpc-clients');

const router = Router();

// ═══════════════════════════════════════════════
//  ACCOUNTS
// ═══════════════════════════════════════════════

// POST /api/accounts — Créer un compte
router.post('/accounts', async (req, res) => {
  try {
    const result = await grpcClients.accounts.create(req.body);
    if (result.error) return res.status(400).json({ error: result.error });
    res.status(201).json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/accounts — Lister les comptes
router.get('/accounts', async (req, res) => {
  try {
    const result = await grpcClients.accounts.list({ owner: req.query.owner || '' });
    if (result.error) return res.status(400).json({ error: result.error });
    res.json(result.accounts || []);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/accounts/:id — Détail d'un compte
router.get('/accounts/:id', async (req, res) => {
  try {
    const result = await grpcClients.accounts.get({ id: req.params.id });
    if (result.error) return res.status(404).json({ error: result.error });
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/accounts/:id — Modifier les infos d'un compte
router.put('/accounts/:id', async (req, res) => {
  try {
    const { owner, type, status } = req.body;
    if (!owner && !type && !status)
      return res.status(400).json({ error: 'Au moins un champ requis : owner, type ou status' });
    const result = await grpcClients.accounts.update({ id: req.params.id, owner: owner || '', type: type || '', status: status || '' });
    if (result.error) return res.status(400).json({ error: result.error });
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/accounts/:id/balance — Modifier le solde
router.patch('/accounts/:id/balance', async (req, res) => {
  try {
    const { amount, operation } = req.body;
    const result = await grpcClients.accounts.updateBalance({ id: req.params.id, amount, operation });
    if (result.error) return res.status(400).json({ error: result.error });
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/accounts/:id — Supprimer (fermer) un compte
router.delete('/accounts/:id', async (req, res) => {
  try {
    const result = await grpcClients.accounts.delete({ id: req.params.id });
    if (result.error) return res.status(404).json({ error: result.error });
    res.json({ message: 'Compte fermé', account: result });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ═══════════════════════════════════════════════
//  TRANSACTIONS
// ═══════════════════════════════════════════════

// POST /api/transactions/transfer — Effectuer un virement
router.post('/transactions/transfer', async (req, res) => {
  try {
    const result = await grpcClients.transactions.transfer(req.body);
    if (result.error) return res.status(400).json({ error: result.error });
    res.status(201).json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/transactions — Lister les transactions
router.get('/transactions', async (req, res) => {
  try {
    const result = await grpcClients.transactions.list({ account_id: req.query.account_id || '' });
    if (result.error) return res.status(400).json({ error: result.error });
    res.json(result.transactions || []);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/transactions/history/:accountId — Historique d'un compte
router.get('/transactions/history/:accountId', async (req, res) => {
  try {
    const result = await grpcClients.transactions.history({
      account_id: req.params.accountId,
      date_from:  req.query.date_from || '',
      date_to:    req.query.date_to   || ''
    });
    if (result.error) return res.status(400).json({ error: result.error });
    res.json(result.transactions || []);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/transactions/:id — Détail d'une transaction
router.get('/transactions/:id', async (req, res) => {
  try {
    const result = await grpcClients.transactions.get({ id: req.params.id });
    if (result.error) return res.status(404).json({ error: result.error });
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ═══════════════════════════════════════════════
//  NOTIFICATIONS
// ═══════════════════════════════════════════════

// POST /api/notifications — Envoyer une notification
router.post('/notifications', async (req, res) => {
  try {
    const result = await grpcClients.notifications.send(req.body);
    if (result.error) return res.status(400).json({ error: result.error });
    res.status(201).json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/notifications/:userId — Notifications d'un utilisateur
router.get('/notifications/:userId', async (req, res) => {
  try {
    const result = await grpcClients.notifications.list({ user_id: req.params.userId });
    if (result.error) return res.status(400).json({ error: result.error });
    res.json(result.notifications || []);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/notifications/:id/read — Marquer comme lu
router.patch('/notifications/:id/read', async (req, res) => {
  try {
    const result = await grpcClients.notifications.markRead({ id: req.params.id });
    if (result.error) return res.status(404).json({ error: result.error });
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
