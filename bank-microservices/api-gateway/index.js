const express              = require('express');
const cors                 = require('cors');
const morgan               = require('morgan');
const bodyParser           = require('body-parser');
const { ApolloServer }     = require('@apollo/server');
const { expressMiddleware } = require('@as-integrations/express4');

const typeDefs   = require('./src/graphql/schema');
const resolvers  = require('./src/graphql/resolvers');
const restRouter = require('./src/rest/routes');

async function bootstrap() {
  const app  = express();
  const PORT = process.env.PORT || 3000;

  app.use(cors());
  app.use(morgan('dev'));
  app.use(bodyParser.json());

  // ─── REST ───────────────────────────────────────────────────────────────────
  app.use('/api', restRouter);

  // ─── GraphQL (Apollo Server v4 + Express 4) ─────────────────────────────────
  const apollo = new ApolloServer({ typeDefs, resolvers });
  await apollo.start();
  app.use('/graphql', expressMiddleware(apollo, { context: async ({ req }) => ({ req }) }));

  // ─── Health ──────────────────────────────────────────────────────────────────
  app.get('/health', (_, res) => res.json({
    status: 'OK', service: 'api-gateway', timestamp: new Date().toISOString()
  }));

  // ─── Index ──────────────────────────────────────────────────────────────────
  app.get('/', (_, res) => res.json({
    name: 'Application Bancaire — API Gateway',
    rest:    `http://localhost:${PORT}/api`,
    graphql: `http://localhost:${PORT}/graphql`,
    health:  `http://localhost:${PORT}/health`,
    endpoints: {
      accounts: [
        'POST   /api/accounts',
        'GET    /api/accounts',
        'GET    /api/accounts/:id',
        'PATCH  /api/accounts/:id/balance',
        'DELETE /api/accounts/:id'
      ],
      transactions: [
        'POST /api/transactions/transfer',
        'GET  /api/transactions',
        'GET  /api/transactions/:id',
        'GET  /api/transactions/history/:accountId'
      ],
      notifications: [
        'POST  /api/notifications',
        'GET   /api/notifications/:userId',
        'PATCH /api/notifications/:id/read'
      ]
    }
  }));

  // ─── 404 & Error handlers ───────────────────────────────────────────────────
  app.use((req, res) => res.status(404).json({ error: `Route ${req.method} ${req.path} introuvable` }));
  app.use((err, req, res, next) => res.status(500).json({ error: err.message }));

  app.listen(PORT, () => {
    console.log(`[api-gateway] ✔  REST    → http://localhost:${PORT}/api`);
    console.log(`[api-gateway] ✔  GraphQL → http://localhost:${PORT}/graphql`);
    console.log(`[api-gateway] ✔  Health  → http://localhost:${PORT}/health`);
  });
}

bootstrap().catch(err => { console.error('[api-gateway] Fatal:', err); process.exit(1); });
