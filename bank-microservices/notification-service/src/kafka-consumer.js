const { Kafka }         = require('kafkajs');
const { v4: uuidv4 }    = require('uuid');
const { notifications } = require('./db');

const kafka = new Kafka({
  clientId: 'notification-service',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
  connectionTimeout: 10000,
  requestTimeout: 30000,
  retry: { retries: 5, initialRetryTime: 300, maxRetryTime: 3000 }
});
const consumer = kafka.consumer({ groupId: 'notification-group-bank' });

const TOPICS = ['account-created', 'account-closed', 'balance-updated', 'transfer-completed', 'transfer-failed'];

function buildNotification(topic, event) {
  const base = {
    id:         uuidv4(),
    account_id: event.accountId || event.fromAccount || '',
    read:       false,
    created_at: new Date().toISOString()
  };
  switch (topic) {
    case 'account-created':
      return { ...base, user_id: event.owner,       type: 'compte',   title: 'Compte créé',       body: `Votre compte a été créé avec un solde de ${event.balance} TND.` };
    case 'account-closed':
      return { ...base, user_id: event.accountId,   type: 'compte',   title: 'Compte fermé',       body: `Le compte ${event.accountId} a été fermé.` };
    case 'balance-updated':
      return { ...base, user_id: event.accountId,   type: 'info',     title: 'Solde mis à jour',   body: `Opération ${event.operation} de ${event.amount} TND. Nouveau solde : ${event.newBalance} TND.` };
    case 'transfer-completed':
      return { ...base, user_id: event.fromAccount, type: 'virement', title: 'Virement effectué',  body: `Virement de ${event.amount} TND vers ${event.toAccount} effectué.` };
    case 'transfer-failed':
      return { ...base, user_id: event.fromAccount || 'system', type: 'alerte', title: 'Virement échoué', body: `Le virement a échoué : ${event.reason}` };
    default:
      return null;
  }
}

async function connect() {
  try {
    await consumer.connect();
    await consumer.subscribe({ topics: TOPICS, fromBeginning: false });
    await consumer.run({
      eachMessage: async ({ topic, message }) => {
        try {
          const event = JSON.parse(message.value.toString());
          const notif = buildNotification(topic, event);
          if (notif) {
            notifications.insert(notif);
            console.log(`[notification-service] Notification créée : "${notif.title}" → ${notif.user_id}`);
          }
        } catch (e) {
          console.error('[notification-service] Erreur traitement message:', e.message);
        }
      }
    });
    console.log('[notification-service] Kafka consumer connecté. Topics :', TOPICS.join(', '));
  } catch (e) {
    console.warn('[notification-service] Kafka indisponible (mode dégradé):', e.message);
  }
}

module.exports = { connect };
