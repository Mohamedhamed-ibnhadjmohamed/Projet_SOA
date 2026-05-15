const { Kafka } = require('kafkajs');

const kafka    = new Kafka({ clientId: 'transaction-service', brokers: [process.env.KAFKA_BROKER || 'localhost:9092'], retry: { retries: 3 } });
const producer = kafka.producer();
let   kafkaOK  = false;

async function connect() {
  try {
    await producer.connect();
    kafkaOK = true;
    console.log('[transaction-service] Kafka connecté');
  } catch (e) {
    console.warn('[transaction-service] Kafka indisponible (mode dégradé):', e.message);
  }
}

async function publish(topic, payload) {
  if (!kafkaOK) return;
  try { await producer.send({ topic, messages: [{ value: JSON.stringify(payload) }] }); }
  catch (e) { console.warn('[transaction-service] Kafka publish error:', e.message); }
}

module.exports = { connect, publish };
