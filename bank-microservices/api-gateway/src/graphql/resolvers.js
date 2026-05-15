const grpcClients = require('../grpc-clients');

const resolvers = {
  Query: {
    account:  (_, { id })            => grpcClients.accounts.get({ id }),
    accounts: (_, { owner = '' })    => grpcClients.accounts.list({ owner }).then(r => r.accounts || []),

    transaction:  (_, { id })                   => grpcClients.transactions.get({ id }),
    transactions: (_, { account_id = '' })       => grpcClients.transactions.list({ account_id }).then(r => r.transactions || []),
    transactionHistory: (_, { account_id, date_from = '', date_to = '' }) =>
      grpcClients.transactions.history({ account_id, date_from, date_to }).then(r => r.transactions || []),

    notifications: (_, { user_id }) => grpcClients.notifications.list({ user_id }).then(r => r.notifications || []),
  },

  Mutation: {
    createAccount:  (_, args) => grpcClients.accounts.create(args),
    updateBalance:  (_, args) => grpcClients.accounts.updateBalance(args),
    deleteAccount:  (_, { id }) => grpcClients.accounts.delete({ id }),

    transfer: (_, args) => grpcClients.transactions.transfer(args),

    sendNotification:      (_, args)   => grpcClients.notifications.send(args),
    markNotificationRead:  (_, { id }) => grpcClients.notifications.markRead({ id }),
  }
};

module.exports = resolvers;
