# Application Bancaire — Microservices

> Mini-projet SoA & Microservices | Dr. Salah Gontara | A.U. 2025-26

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Client  (REST / GraphQL)                                       │
└───────────────────────┬─────────────────────────────────────────┘
                        │ HTTP/1.1 · JSON
                        ▼
         ┌──────────────────────────┐
         │       API Gateway        │  :3000
         │  REST (Express)          │
         │  GraphQL (Apollo v4)     │
         └──┬──────────┬──────────┬─┘
            │ gRPC     │ gRPC     │ gRPC
            │ HTTP/2   │ HTTP/2   │ HTTP/2
            │ Protobuf │ Protobuf │ Protobuf
            ▼          ▼          ▼
    ┌───────────┐ ┌──────────────┐ ┌──────────────────┐
    │  account  │ │ transaction  │ │  notification    │
    │  service  │ │  service     │ │  service         │
    │  :50051   │ │  :50052      │ │  :50053          │
    └─────┬─────┘ └──────┬───────┘ └────────┬─────────┘
          │              │                  │
        SQLite3        SQLite3          JSON/NoSQL
          │              │                  │
          └──────────────┴──────────────────┘
                         │  Kafka Events
                  ┌──────┴──────┐
                  │    Kafka    │
                  │   Broker    │
                  └─────────────┘
```

## Microservices

| Service            | Port  | Base de données | Rôle                             |
|--------------------|-------|-----------------|----------------------------------|
| api-gateway        | 3000  | —               | REST + GraphQL → gRPC            |
| account-service    | 50051 | SQLite3 (SQL)   | CRUD comptes bancaires           |
| transaction-service| 50052 | SQLite3 (SQL)   | Virements + historique           |
| notification-service| 50053| JSON/NoSQL      | Alertes consommées via Kafka     |

## Topics Kafka

| Topic               | Producteur          | Consommateur(s)      | Événement métier              |
|---------------------|---------------------|----------------------|-------------------------------|
| `account-created`   | account-service     | notification-service | Nouveau compte créé           |
| `account-closed`    | account-service     | notification-service | Compte fermé                  |
| `balance-updated`   | account-service     | —                    | Solde modifié manuellement    |
| `transfer-completed`| transaction-service | notification-service | Virement réussi               |
| `transfer-failed`   | transaction-service | notification-service | Virement échoué               |

---

## Installation & Démarrage

### Option 1 — Docker Compose *(recommandé)*

```bash
docker-compose up --build
```

### Option 2 — Local (sans Docker)

> Kafka est optionnel. Tous les services démarrent en mode dégradé si Kafka est absent.

```bash
chmod +x start.sh
./start.sh
```

Ou manuellement dans 4 terminaux :

```bash
cd account-service      && npm install && node src/server.js
cd transaction-service  && npm install && node src/server.js
cd notification-service && npm install && node src/server.js
cd api-gateway          && npm install && node index.js
```

---

## Endpoints REST

### Comptes — `/api/accounts`

| Méthode  | URL                          | Description            |
|----------|------------------------------|------------------------|
| `POST`   | `/api/accounts`              | Créer un compte        |
| `GET`    | `/api/accounts`              | Lister tous les comptes|
| `GET`    | `/api/accounts?owner=alice`  | Filtrer par owner      |
| `GET`    | `/api/accounts/:id`          | Obtenir un compte      |
| `PATCH`  | `/api/accounts/:id/balance`  | Modifier le solde      |
| `DELETE` | `/api/accounts/:id`          | Fermer un compte       |

**Exemple :**
```bash
# Créer un compte
curl -X POST http://localhost:3000/api/accounts \
  -H "Content-Type: application/json" \
  -d '{"owner":"alice","type":"courant","balance":2000}'

# Lister les comptes d'alice
curl http://localhost:3000/api/accounts?owner=alice
```

### Transactions — `/api/transactions`

| Méthode | URL                                    | Description          |
|---------|----------------------------------------|----------------------|
| `POST`  | `/api/transactions/transfer`           | Virement             |
| `GET`   | `/api/transactions`                    | Toutes transactions  |
| `GET`   | `/api/transactions?account_id=xxx`     | Par compte           |
| `GET`   | `/api/transactions/:id`                | Détail               |
| `GET`   | `/api/transactions/history/:accountId` | Historique           |

**Exemple :**
```bash
curl -X POST http://localhost:3000/api/transactions/transfer \
  -H "Content-Type: application/json" \
  -d '{"from_account":"ID1","to_account":"ID2","amount":500,"description":"Loyer"}'
```

### Notifications — `/api/notifications`

| Méthode  | URL                              | Description               |
|----------|----------------------------------|---------------------------|
| `POST`   | `/api/notifications`             | Envoyer une notification  |
| `GET`    | `/api/notifications/:userId`     | Notifications d'un user   |
| `PATCH`  | `/api/notifications/:id/read`    | Marquer comme lue         |

---

## GraphQL

Interface interactive : **http://localhost:3000/graphql**

### Queries

```graphql
# Consulter un compte
query {
  account(id: "ACCOUNT_ID") {
    id owner type balance status
  }
}

# Lister les comptes d'un owner
query {
  accounts(owner: "alice") {
    id type balance created_at
  }
}

# Historique des transactions
query {
  history(account_id: "ACCOUNT_ID") {
    id amount status description created_at
  }
}

# Notifications d'un utilisateur
query {
  notifications(user_id: "alice") {
    title body read created_at
  }
}
```

### Mutations

```graphql
# Créer un compte
mutation {
  createAccount(owner: "alice", type: "courant", balance: 5000) {
    id balance
  }
}

# Virement
mutation {
  transfer(
    from_account: "ID1"
    to_account:   "ID2"
    amount:       300
    description:  "Remboursement"
  ) {
    id status created_at
  }
}

# Fermer un compte
mutation {
  deleteAccount(id: "ACCOUNT_ID") {
    success message
  }
}
```

---

## Fichiers Proto

| Fichier                                    | Service gRPC       | Méthodes                                             |
|--------------------------------------------|--------------------|------------------------------------------------------|
| `account-service/proto/account.proto`      | AccountService     | CreateAccount, GetAccount, ListAccounts, UpdateBalance, DeleteAccount |
| `transaction-service/proto/transaction.proto` | TransactionService | Transfer, GetTransaction, ListTransactions, GetHistory |
| `notification-service/proto/notification.proto` | NotificationService | SendNotification, ListNotifications, MarkAsRead |

---

## Structure du projet

```
bank-microservices/
├── api-gateway/
│   ├── src/
│   │   ├── rest/           → routes.js  (Express REST)
│   │   ├── graphql/        → schema.js + resolvers.js (Apollo v4)
│   │   └── grpc-clients/   → index.js  (clients gRPC vers services)
│   ├── index.js
│   └── package.json
├── account-service/
│   ├── proto/account.proto
│   ├── src/
│   │   ├── server.js       → Bootstrap gRPC + Kafka producer
│   │   ├── handlers.js     → Logique métier
│   │   └── db.js           → SQLite3
│   └── package.json
├── transaction-service/
│   ├── proto/transaction.proto
│   ├── src/
│   │   ├── server.js
│   │   ├── handlers.js
│   │   ├── kafka-producer.js
│   │   └── db.js           → SQLite3
│   └── package.json
├── notification-service/
│   ├── proto/notification.proto
│   ├── src/
│   │   ├── server.js
│   │   ├── kafka-consumer.js
│   │   └── db.js           → NoSQL JSON document store
│   └── package.json
├── docker-compose.yml
├── start.sh
└── README.md
```

## Stack technique

| Technologie       | Usage                               |
|-------------------|-------------------------------------|
| Node.js 18        | Runtime tous services               |
| gRPC + Protobuf   | Communication inter-services        |
| Express 4         | Serveur REST API Gateway            |
| Apollo Server v4  | Serveur GraphQL API Gateway         |
| Kafka (KafkaJS)   | Événements asynchrones inter-services |
| SQLite3           | Base SQL (accounts, transactions)   |
| JSON document store | Base NoSQL (notifications)        |
| Docker Compose    | Orchestration complète              |
