const grpc           = require('@grpc/grpc-js');
const protoLoader    = require('@grpc/proto-loader');
const path           = require('path');
const { v4: uuidv4 } = require('uuid');
const kafkaConsumer  = require('./kafka-consumer');
const { notifications } = require('./db');

// ─── Load proto ───────────────────────────────────────────────────────────────
const PROTO = path.join(__dirname, '../proto/notification.proto');
const pkg   = grpc.loadPackageDefinition(
  protoLoader.loadSync(PROTO, { keepCase: true, longs: String, enums: String, defaults: true, oneofs: true })
).notification;

// ─── helpers ─────────────────────────────────────────────────────────────────
const ok  = doc => ({ ...doc, error: '' });
const err = msg => ({ error: msg });

// ─── gRPC handlers ────────────────────────────────────────────────────────────

function sendNotification(call, callback) {
  try {
    const { user_id, type, title, body, account_id } = call.request;
    if (!user_id || !body) return callback(null, err('user_id et body requis'));

    const doc = notifications.insert({
      id:         uuidv4(),
      user_id,
      type:       type       || 'info',
      title:      title      || 'Notification',
      body,
      account_id: account_id || '',
      read:       false,
      created_at: new Date().toISOString()
    });

    callback(null, ok(doc));
  } catch (e) {
    callback(null, err(e.message));
  }
}

function listNotifications(call, callback) {
  try {
    const { user_id } = call.request;
    const docs = notifications.find({ user_id });
    // sort newest first
    docs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    callback(null, { notifications: docs, error: '' });
  } catch (e) {
    callback(null, { notifications: [], error: e.message });
  }
}

function markAsRead(call, callback) {
  try {
    const doc = notifications.upsert(call.request.id, { read: true });
    if (!doc) return callback(null, err('Notification introuvable'));
    callback(null, ok(doc));
  } catch (e) {
    callback(null, err(e.message));
  }
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────
async function main() {
  await kafkaConsumer.connect();

  const server = new grpc.Server();
  server.addService(pkg.NotificationService.service, {
    sendNotification,
    listNotifications,
    markAsRead
  });

  const PORT = process.env.PORT || '50053';
  server.bindAsync(`0.0.0.0:${PORT}`, grpc.ServerCredentials.createInsecure(), (err, port) => {
    if (err) throw err;
    console.log(`[notification-service] gRPC server listening on :${port}`);
  });
}

main().catch(console.error);
