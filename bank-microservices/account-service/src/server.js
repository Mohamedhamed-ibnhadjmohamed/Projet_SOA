const grpc        = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path        = require('path');
const { Kafka }   = require('kafkajs');
const handlers    = require('./handlers');

// ─── Proto ────────────────────────────────────────────────────────────────────
const PROTO = path.join(__dirname, '../proto/account.proto');
const pkg   = grpc.loadPackageDefinition(
  protoLoader.loadSync(PROTO, { keepCase: true, longs: String, enums: String, defaults: true, oneofs: true })
).account;

// ─── Kafka producer ───────────────────────────────────────────────────────────
const kafka    = new Kafka({ clientId: 'account-service', brokers: [process.env.KAFKA_BROKER || 'localhost:9092'], retry: { retries: 3 } });
const producer = kafka.producer();
let   kafkaOK  = false;

async function connectKafka() {
  try {
    await producer.connect();
    kafkaOK = true;
    console.log('[account-service] Kafka connecté');
  } catch (e) {
    console.warn('[account-service] Kafka indisponible (mode dégradé):', e.message);
  }
}

async function publish(topic, payload) {
  if (!kafkaOK) return;
  try { await producer.send({ topic, messages: [{ value: JSON.stringify(payload) }] }); }
  catch (e) { console.warn('[account-service] Kafka publish error:', e.message); }
}

// ─── gRPC service ─────────────────────────────────────────────────────────────
const service = {
  createAccount: (call, cb) => handlers.createAccount(call, cb, publish),
  getAccount:    (call, cb) => handlers.getAccount(call, cb),
  listAccounts:  (call, cb) => handlers.listAccounts(call, cb),
  updateBalance: (call, cb) => handlers.updateBalance(call, cb, publish),
  deleteAccount: (call, cb) => handlers.deleteAccount(call, cb, publish),
};

// ─── Start ────────────────────────────────────────────────────────────────────
async function main() {
  await connectKafka();
  const server = new grpc.Server();
  server.addService(pkg.AccountService.service, service);
  const PORT = process.env.PORT || '50051';
  server.bindAsync(`0.0.0.0:${PORT}`, grpc.ServerCredentials.createInsecure(), (err, port) => {
    if (err) throw err;
    console.log(`[account-service] gRPC listening on :${port}`);
  });
}

main().catch(console.error);
