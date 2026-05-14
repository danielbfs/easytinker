#!/bin/sh
# Generates technical secrets on first run and persists them in /secrets.
# Idempotent: existing files are kept as-is across redeploys.
set -e

apk add --no-cache openssl >/dev/null 2>&1 || true

S=/secrets
mkdir -p "$S"

[ -s "$S/postgres-password" ] || openssl rand -hex 32   > "$S/postgres-password"
[ -s "$S/nextauth-secret" ]   || openssl rand -base64 32 > "$S/nextauth-secret"
[ -s "$S/encryption-key" ]    || openssl rand -hex 32   > "$S/encryption-key"
[ -s "$S/worker-secret" ]     || openssl rand -hex 32   > "$S/worker-secret"

# Strip trailing newline from base64 output so consumers don't get a stray \n
for f in "$S"/*; do
  v=$(cat "$f")
  printf '%s' "$v" > "$f"
done

chmod 644 "$S"/*
echo "init-secrets: 4 secrets present in $S"
