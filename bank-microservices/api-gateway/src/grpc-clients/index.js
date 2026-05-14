const grpc        = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path        = require('path');

const OPTS = { keepCase: true, longs: String, enums: String, defaults: true, oneofs: true };
const load = f => grpc.loadPackageDefinition(protoLoader.loadSync(f, OPTS));

const ROOT = path.join(__dirname, '..', '..'); // bank-microservices/

const accountPkg      = load(path.join(ROOT, 'account-service/proto/account.proto')).account;
const transactionPkg  = load(path.join(ROOT, 'transaction-service/proto/transaction.proto')).transaction;
const notificationPkg = load(path.join(ROOT, 'notification-service/proto/notification.proto')).notification;

const creds = grpc.credentials.createInsecure();

const accountClient      = new accountPkg.AccountService(      process.env.ACCOUNT_HOST      || 'localhost:50051', creds);
const transactionClient  = new transactionPkg.TransactionService(process.env.TRANSACTION_HOST  || 'localhost:50052', creds);
const notificationClient = new notificationPkg.NotificationService(process.env.NOTIFICATION_HOST || 'localhost:50053', creds);

const rpc = (client, method, req) =>
  new Promise((resolve, reject) =>
    client[method](req, (err, res) => err ? reject(err) : resolve(res))
  );

module.exports = {
  accounts: {
    create:        req => rpc(accountClient, 'createAccount', req),
    get:           req => rpc(accountClient, 'getAccount',    req),
    list:          req => rpc(accountClient, 'listAccounts',  req),
    updateBalance: req => rpc(accountClient, 'updateBalance', req),
    delete:        req => rpc(accountClient, 'deleteAccount', req),
  },
  transactions: {
    transfer:  req => rpc(transactionClient, 'transfer',         req),
    get:       req => rpc(transactionClient, 'getTransaction',   req),
    list:      req => rpc(transactionClient, 'listTransactions', req),
    history:   req => rpc(transactionClient, 'getHistory',       req),
  },
  notifications: {
    send:     req => rpc(notificationClient, 'sendNotification',  req),
    list:     req => rpc(notificationClient, 'listNotifications', req),
    markRead: req => rpc(notificationClient, 'markAsRead',        req),
  }
};
