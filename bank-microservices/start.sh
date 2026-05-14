#!/bin/bash
# ─────────────────────────────────────────────────────────────
#  Application Bancaire — Démarrage local (sans Docker)
#  Kafka est optionnel. Les services démarrent en mode dégradé
#  si Kafka n'est pas disponible sur localhost:9092
# ─────────────────────────────────────────────────────────────
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║   Application Bancaire — Microservices           ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

install_deps() {
  local dir=$1
  echo "  ⬇  npm install — $dir"
  (cd "$ROOT/$dir" && npm install --silent)
}

install_deps account-service
install_deps transaction-service
install_deps notification-service
install_deps api-gateway

echo ""
echo "  ▶  account-service      (gRPC :50051)"
(cd "$ROOT/account-service"      && node src/server.js) &
PID_A=$!
sleep 2

echo "  ▶  transaction-service  (gRPC :50052)"
(cd "$ROOT/transaction-service"  && node src/server.js) &
PID_T=$!
sleep 2

echo "  ▶  notification-service (gRPC :50053)"
(cd "$ROOT/notification-service" && node src/server.js) &
PID_N=$!
sleep 2

echo "  ▶  api-gateway          (HTTP :3000)"
(cd "$ROOT/api-gateway"          && node index.js) &
PID_G=$!

echo ""
echo "════════════════════════════════════════════════════"
echo "  REST     →  http://localhost:3000/api"
echo "  GraphQL  →  http://localhost:3000/graphql"
echo "  Health   →  http://localhost:3000/health"
echo "════════════════════════════════════════════════════"
echo "  Ctrl+C pour tout arrêter"
echo ""

trap "echo ''; echo 'Arrêt…'; kill $PID_A $PID_T $PID_N $PID_G 2>/dev/null; exit 0" SIGINT SIGTERM
wait
