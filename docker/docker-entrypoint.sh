#!/bin/sh
# Loads secrets from the shared /secrets volume into env vars, then execs
# whatever command the container was started with. Works for both the Next.js
# app and the Python worker — each container only consumes the vars it needs.
set -e

S=/secrets
if [ -d "$S" ]; then
  [ -s "$S/postgres-password" ] && POSTGRES_PASSWORD=$(cat "$S/postgres-password") && export POSTGRES_PASSWORD
  [ -s "$S/nextauth-secret" ]   && NEXTAUTH_SECRET=$(cat "$S/nextauth-secret")     && export NEXTAUTH_SECRET
  [ -s "$S/encryption-key" ]    && ENCRYPTION_KEY=$(cat "$S/encryption-key")       && export ENCRYPTION_KEY
  [ -s "$S/worker-secret" ]     && WORKER_SECRET=$(cat "$S/worker-secret")         && export WORKER_SECRET
fi

# Compose DATABASE_URL from parts we now control (only when all three are set).
if [ -n "$POSTGRES_USER" ] && [ -n "$POSTGRES_PASSWORD" ] && [ -n "$POSTGRES_DB" ]; then
  export DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}"
fi

exec "$@"
