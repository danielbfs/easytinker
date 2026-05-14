# Roadmap

## Deploy / Operations

### Auto-generate technical secrets on first deploy

When the stack is brought up for the first time on a fresh host, the four
**technical** secrets currently have to be filled in by hand in `.env`
before `docker compose up` will work:

- `POSTGRES_PASSWORD`
- `NEXTAUTH_SECRET`
- `ENCRYPTION_KEY`
- `WORKER_SECRET`

These are not credentials a human needs to know — they exist solely so the
containers can authenticate to each other and encrypt data at rest. They
should be generated automatically on the first deploy and then persisted,
so subsequent deploys reuse the same values (rotating them silently would
invalidate sessions and break decryption of stored API keys).

OAuth credentials (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
`GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`) and `APP_DOMAIN` remain manual
— they come from external systems and cannot be auto-generated.

**Proposed implementation:**

1. Add a `bootstrap` service to `docker-compose.yml` that runs before the
   others, mounts a `secrets` named volume, and on first run only
   (`[ ! -f /secrets/.env ]`) writes the four generated values to
   `/secrets/.env` via `openssl rand`.
2. Switch Postgres from `POSTGRES_PASSWORD` to `POSTGRES_PASSWORD_FILE`
   pointing at `/run/secrets/postgres_password` (natively supported).
3. Add a thin entrypoint wrapper to the `app` and `worker` images that
   does `set -a; . /secrets/.env; set +a` before `exec`-ing the real
   command, so the four secrets become environment variables without
   needing to be in the host's `.env`.
4. `depends_on: bootstrap` on every consumer service, with
   `condition: service_completed_successfully`.

After this lands, a fresh deploy on a clean Hostinger box only needs the
user to fill in `APP_DOMAIN` + OAuth keys — everything else self-heals.
