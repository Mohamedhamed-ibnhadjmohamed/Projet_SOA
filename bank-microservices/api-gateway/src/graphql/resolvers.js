const clients = require('../grpc-clients');

const resolvers = {
  Query: {
    account:       (_, { id })           => clients.accounts.get({ id }),
    accounts:      (_, { owner })        => clients.accounts.list({ owner: owner || '' }).then(r => r.accounts || []),
    transaction:   (_, { id })           => clients.transactions.get({ id }),
    transactions:  (_, { account_id })   => clients.transactions.list({ account_id: account_id || '' }).then(r => r.transactions || []),
    history:       (_, { account_id, date_from, date_to }) =>
                     clients.transactions.history({ account_id, date_from: date_from || '', date_to: date_to || '' }).then(r => r.transactions || []),
    notifications: (_, { user_id })      => clients.notifications.list({ user_id }).then(r => r.notifications || []),
  },
  Mutation: {
    createAccount:        (_, { owner, type, balance })                               => clients.accounts.create({ owner, type, balance: balance || 0 }),
    updateBalance:        (_, { id, amount, operation })                              => clients.accounts.updateBalance({ id, amount, operation }),
    deleteAccount:        (_, { id })                                                 => clients.accounts.delete({ id }),
    transfer:             (_, { from_account, to_account, amount, description })      => clients.transactions.transfer({ from_account, to_account, amount, description: description || '' }),
    sendNotification:     (_, { user_id, type, title, body, account_id })             => clients.notifications.send({ user_id, type: type || 'info', title: title || 'Notification', body, account_id: account_id || '' }),
    markNotificationRead: (_, { id })                                                 => clients.notifications.markRead({ id }),
  }
};

module.exports = resolvers;
