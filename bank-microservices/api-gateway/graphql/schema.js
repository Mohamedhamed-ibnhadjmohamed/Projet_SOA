const { gql } = require('graphql-tag');

const typeDefs = gql`
  type Account {
    id:         String
    owner:      String
    type:       String
    balance:    Float
    status:     String
    created_at: String
    error:      String
  }

  type Transaction {
    id:           String
    from_account: String
    to_account:   String
    amount:       Float
    type:         String
    status:       String
    description:  String
    created_at:   String
    error:        String
  }

  type Notification {
    id:         String
    user_id:    String
    type:       String
    title:      String
    body:       String
    account_id: String
    read:       Boolean
    created_at: String
    error:      String
  }

  type StatusResult {
    success: Boolean
    message: String
  }

  # ── Queries ──────────────────────────────────────────────────
  type Query {
    account(id: String!): Account
    accounts(owner: String): [Account]

    transaction(id: String!): Transaction
    transactions(account_id: String): [Transaction]
    history(account_id: String!, date_from: String, date_to: String): [Transaction]

    notifications(user_id: String!): [Notification]
  }

  # ── Mutations ─────────────────────────────────────────────────
  type Mutation {
    createAccount(owner: String!, type: String!, balance: Float): Account
    updateBalance(id: String!, amount: Float!, operation: String!): Account
    deleteAccount(id: String!): StatusResult

    transfer(
      from_account: String!
      to_account:   String!
      amount:       Float!
      description:  String
    ): Transaction

    sendNotification(
      user_id:    String!
      type:       String
      title:      String
      body:       String!
      account_id: String
    ): Notification

    markNotificationRead(id: String!): Notification
  }
`;

module.exports = typeDefs;
