# Application Bancaire — Microservices Node.js
**Cours : SoA & Microservices | Dr. Salah Gontara | A.U. 2025-26**

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│              CLIENT (Postman / Navigateur)        │
└─────────────────┬───────────────────────────────┘
                  │ HTTP :3000
         ┌────────▼────────┐
         │   API Gateway   │  REST + GraphQL (Apollo v4)
         └──┬──────┬──────┘
            │gRPC  │gRPC  │gRPC
     :50051 │   :50052    :50053
  ┌─────────▼─┐ ┌──▼──────────┐ ┌───▼──────────────┐
  │  Account  │ │ Transaction │ │  Notification    │
  │  Service  │ │   Service   │ │    Service       │
  │ (SQLite3) │ │  (SQLite3)  │ │  (JSON / NoSQL)  │
  └─────┬─────┘ └──────┬──────┘ └────────▲─────────┘
        │  Kafka        │  Kafka           │ Kafka
        └───────────────┴──────────────────┘
                    (optionnel)
```

### Services & Ports
| Service              | Port  | Base de données | Protocole      |
|----------------------|-------|-----------------|----------------|
| api-gateway          | 3000  | —               | REST + GraphQL |
| account-service      | 50051 | SQLite3         | gRPC + Kafka   |
| transaction-service  | 50052 | SQLite3         | gRPC + Kafka   |
| notification-service | 50053 | JSON (fichier)  | gRPC + Kafka   |

### Topics Kafka
| Topic               | Producteur           | Consommateur         |
|---------------------|----------------------|----------------------|
| account-created     | account-service      | notification-service |
| account-closed      | account-service      | notification-service |
| balance-updated     | account-service      | notification-service |
| transfer-completed  | transaction-service  | notification-service |
| transfer-failed     | transaction-service  | notification-service |

---

## Installation (sans Docker)

```bash
# 1. api-gateway
cd api-gateway
npm install

# 2. account-service
cd ../account-service
npm install

# 3. transaction-service
cd ../transaction-service
npm install

# 4. notification-service
cd ../notification-service
npm install
```

---

## Lancement — 4 terminaux séparés

```bash
# Terminal 1 — account-service
cd account-service
node src/server.js

# Terminal 2 — transaction-service
cd transaction-service
node src/server.js

# Terminal 3 — notification-service
cd notification-service
node src/server.js

# Terminal 4 — api-gateway
cd api-gateway
node index.js
```

> **Kafka est optionnel** : les services démarrent en mode dégradé sans Kafka.
> Les bases de données SQLite3 et JSON sont créées automatiquement dans `*/data/`.

---

## Endpoints REST

### Comptes
```
POST   http://localhost:3000/api/accounts
GET    http://localhost:3000/api/accounts
GET    http://localhost:3000/api/accounts/:id
PATCH  http://localhost:3000/api/accounts/:id/balance
DELETE http://localhost:3000/api/accounts/:id
```

**Créer un compte (POST /api/accounts)**
```json
{ "owner": "Ali Ben Salah", "type": "courant", "balance": 1000 }
```

**Modifier le solde (PATCH /api/accounts/:id/balance)**
```json
{ "amount": 200, "operation": "credit" }
```
> operation : `"credit"` ou `"debit"`

### Transactions
```
POST http://localhost:3000/api/transactions/transfer
GET  http://localhost:3000/api/transactions
GET  http://localhost:3000/api/transactions/:id
GET  http://localhost:3000/api/transactions/history/:accountId
```

**Effectuer un virement (POST /api/transactions/transfer)**
```json
{ "from_account": "ID_SOURCE", "to_account": "ID_DEST", "amount": 150, "description": "Loyer" }
```

### Notifications
```
POST  http://localhost:3000/api/notifications
GET   http://localhost:3000/api/notifications/:userId
PATCH http://localhost:3000/api/notifications/:id/read
```

---

## GraphQL — http://localhost:3000/graphql

### Queries
```graphql
# Lister tous les comptes
query { accounts { id owner type balance status } }

# Détail d'un compte
query { account(id: "COMPTE_ID") { id owner balance status } }

# Lister les transactions
query { transactions { id from_account to_account amount status } }

# Notifications d'un utilisateur
query { notifications(user_id: "Ali Ben Salah") { id title body read } }
```

### Mutations
```graphql
# Créer un compte
mutation {
  createAccount(owner: "Ali Ben Salah", type: "courant", balance: 1000) {
    id owner balance
  }
}

# Virement
mutation {
  transfer(from_account: "ID1", to_account: "ID2", amount: 100) {
    id status amount
  }
}
```

---

## Health Check
```
GET http://localhost:3000/health
GET http://localhost:3000/
```
