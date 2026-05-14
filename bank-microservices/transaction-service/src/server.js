const grpc           = require('@grpc/grpc-js');
const protoLoader    = require('@grpc/proto-loader');
const path           = require('path');
const kafkaProducer  = require('./kafka-producer');
const handlers       = require('./handlers');

// ─── Load proto ───────────────────────────────────────────────────────────────
const PROTO = path.join(__dirname, '../proto/transaction.proto');
const pkg   = grpc.loadPackageDefinition(
  protoLoader.loadSync(PROTO, { keepCase: true, longs: String, enums: String, defaults: true, oneofs: true })
).transaction;

// ─── gRPC service impl ────────────────────────────────────────────────────────
const service = {
  transfer:         handlers.transfer,
  getTransaction:   handlers.getTransaction,
  listTransactions: handlers.listTransactions,
  getHistory:       handlers.getHistory,
};

// ─── Bootstrap ────────────────────────────────────────────────────────────────
async function main() {
  await kafkaProducer.connect();

  const server = new grpc.Server();
  server.addService(pkg.TransactionService.service, service);

  const PORT = process.env.PORT || '50052';
  server.bindAsync(`0.0.0.0:${PORT}`, grpc.ServerCredentials.createInsecure(), (err, port) => {
    if (err) throw err;
    console.log(`[transaction-service] gRPC server listening on :${port}`);
  });
}

main().catch(console.error);
