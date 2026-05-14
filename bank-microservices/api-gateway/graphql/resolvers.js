const clients = require('../grpc-clients');

const resolvers = {
  Query: {
    // ── Accounts ──────────────────────────────────────────────
    account: async (_, { id }) => {
      const res = await clients.accounts.get({ id });
      return res;
    },
    accounts: async (_, { owner }) => {
      const res = await clients.accounts.list({ owner: owner || '' });
      return res.accounts || [];
    },

    // ── Transactions ──────────────────────────────────────────
    transaction: async (_, { id }) => {
      return clients.transactions.get({ id });
    },
    transactions: async (_, { account_id }) => {
      const res = await clients.transactions.list({ account_id: account_id || '' });
      return res.transactions || [];
    },
    history: async (_, { account_id, date_from, date_to }) => {
      const res = await clients.transactions.history({
        account_id,
        date_from: date_from || '',
        date_to:   date_to   || ''
      });
      return res.transactions || [];
    },

    // ── Notifications ─────────────────────────────────────────
    notifications: async (_, { user_id }) => {
      const res = await clients.notifications.list({ user_id });
      return res.notifications || [];
    }
  },

  Mutation: {
    // ── Accounts ──────────────────────────────────────────────
    createAccount: async (_, { owner, type, balance }) => {
      return clients.accounts.create({ owner, type, balance: balance || 0 });
    },
    updateBalance: async (_, { id, amount, operation }) => {
      return clients.accounts.updateBalance({ id, amount, operation });
    },
    deleteAccount: async (_, { id }) => {
      return clients.accounts.delete({ id });
    },

    // ── Transactions ──────────────────────────────────────────
    transfer: async (_, { from_account, to_account, amount, description }) => {
      return clients.transactions.transfer({
        from_account,
        to_account,
        amount,
        description: description || ''
      });
    },

    // ── Notifications ─────────────────────────────────────────
    sendNotification: async (_, { user_id, type, title, body, account_id }) => {
      return clients.notifications.send({
        user_id,
        type:       type       || 'info',
        title:      title      || 'Notification',
        body,
        account_id: account_id || ''
      });
    },
    markNotificationRead: async (_, { id }) => {
      return clients.notifications.markRead({ id });
    }
  }
};

module.exports = resolvers;
