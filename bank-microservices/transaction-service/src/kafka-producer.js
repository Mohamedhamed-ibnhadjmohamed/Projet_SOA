const { Kafka } = require('kafkajs');

const kafka    = new Kafka({ clientId: 'transaction-service', brokers: [process.env.KAFKA_BROKER || 'localhost:9092'], retry: { retries: 3 } });
const producer = kafka.producer();
let   ready    = false;

async function connect() {
  try {
    await producer.connect();
    ready = true;
    console.log('[transaction-service] Kafka producer connecté');
  } catch (e) {
    console.warn('[transaction-service] Kafka indisponible (mode dégradé):', e.message);
  }
}

async function publish(topic, payload) {
  if (!ready) return;
  try { await producer.send({ topic, messages: [{ value: JSON.stringify(payload) }] }); }
  catch (e) { console.warn('[transaction-service] Kafka publish error:', e.message); }
}

module.exports = { connect, publish };
