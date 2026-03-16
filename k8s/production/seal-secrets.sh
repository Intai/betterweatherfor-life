#!/bin/bash
#
# Seal production secrets using kubeseal.
#
# Prerequisites:
#   1. Install kubeseal CLI: brew install kubeseal
#   2. Install Sealed Secrets controller in cluster:
#      kubectl apply -k k8s/cluster/
#   3. Wait for controller to be ready:
#      kubectl wait --for=condition=ready pod -l name=sealed-secrets-controller -n kube-system --timeout=60s
#
# Usage:
#   ./seal-secrets.sh <POSTGRES_PASSWORD> <GOOGLE_MAPS_API_KEY>
#
# Deploy order:
#   1. kubectl apply -k k8s/cluster/           # cluster infra (once per cluster)
#   2. ./seal-secrets.sh <password> <api-key>  # seal secrets (once, after controller is ready)
#   3. kubectl apply -k k8s/production/        # app deployment
#
# Back up the controller's private key (store securely, never in git):
#   kubectl get secret -n kube-system -l sealedsecrets.bitnami.com/sealed-secrets-key -o yaml > sealed-secrets-key-backup.yaml
#
# Restore private key to a new cluster:
#   kubectl apply -f sealed-secrets-key-backup.yaml
#   kubectl rollout restart deployment sealed-secrets-controller -n kube-system

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
NAMESPACE="betterweather"

if [ $# -ne 2 ]; then
  echo "Usage: $0 <POSTGRES_PASSWORD> <GOOGLE_MAPS_API_KEY>"
  exit 1
fi

POSTGRES_PASSWORD="$1"
GOOGLE_MAPS_API_KEY="$2"
DATABASE_URL="postgres://betterweather:${POSTGRES_PASSWORD}@db:5432/betterweather"

echo "Sealing db-secret..."
kubectl create secret generic db-secret \
  --namespace="$NAMESPACE" \
  --from-literal="POSTGRES_PASSWORD=$POSTGRES_PASSWORD" \
  --from-literal="DATABASE_URL=$DATABASE_URL" \
  --dry-run=client -o yaml \
  | kubeseal --format yaml \
  > "$SCRIPT_DIR/db-sealed-secret.yaml"

echo "Sealing web-secret..."
kubectl create secret generic web-secret \
  --namespace="$NAMESPACE" \
  --from-literal="GOOGLE_MAPS_API_KEY=$GOOGLE_MAPS_API_KEY" \
  --dry-run=client -o yaml \
  | kubeseal --format yaml \
  > "$SCRIPT_DIR/web-sealed-secret.yaml"

echo "Done. Sealed secrets written to:"
echo "  $SCRIPT_DIR/db-sealed-secret.yaml"
echo "  $SCRIPT_DIR/web-sealed-secret.yaml"
echo ""
echo "You can now commit these files safely to git."
