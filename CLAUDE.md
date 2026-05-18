# CLAUDE.md

Context for Claude sessions working on EaseTinker. Read this before suggesting changes.

## What this project is

A SaaS that wraps the Thinking Machines **Tinker SDK** for LoRA fine-tuning of LLMs. Users sign in, store their Tinker API key, create a Project (base model + data sources), configure a training job (LoRA rank / lr / epochs / batch size), and watch loss/checkpoints come back.

Production: https://easetinker.sigame.tec.br (Hostinger VPS, single instance).

## Stack

- **App** (`src/`) — Next.js 16.2 (App Router, Turbopack), Auth.js v5 beta, Prisma 6, TypeScript, Tailwind, shadcn-style components. Standalone build inside `easetinker-app` container.
- **Worker** (`worker/`) — Python 3.12, FastAPI, tinker SDK, BullMQ via Redis. Internal only — Next.js calls it with a shared `WORKER_SECRET`. Container: `easetinker-worker`.
- **Data** — PostgreSQL 16 (`easetinker-postgres`), Redis 7 (`easetinker-redis`), local uploads volume.
- **Edge** — Traefik on the host (network_mode: host), HTTPS via Let's Encrypt.

## Deploy & ops — READ THIS FIRST

The project on the server is at `/docker/easetinker/` and **is a real git checkout** of `main`. The Hostinger Docker Manager UI was used originally but **must not be used for updates anymore** — its Rebuild button can clobber the working tree. Convert any UI-managed instance by running the one-time procedure in `README.md` → Updating → Option B.

**Update flow** (the only flow):
```bash
cd /docker/easetinker
git pull origin main
docker compose build --no-cache
docker compose up -d --remove-orphans
docker compose exec -T app /usr/local/bin/docker-entrypoint.sh pnpm exec prisma migrate deploy
docker image prune -f
docker compose ps
```

The migration command **must go through the entrypoint** — `docker exec` doesn't inherit env vars exported by the container's PID 1, and `DATABASE_URL` is one of them.

### Auto-generated secrets

Four technical secrets (`POSTGRES_PASSWORD`, `NEXTAUTH_SECRET`, `ENCRYPTION_KEY`, `WORKER_SECRET`) are generated on first boot by the `init-secrets` compose service and stored in the `secrets` named volume. They're loaded into the app and worker by `docker/docker-entrypoint.sh`. Only `APP_DOMAIN` and OAuth keys live in `.env`.

If you ever need the running values, read them from inside a container with `cat /secrets/<name>` — never echo them to a user-visible channel.

## What's implemented

- **Auth** — Google OAuth working. GitHub is wired but the OAuth app isn't configured yet (`.env` keys empty).
- **Pages** — `/` redirects by auth state, `/login` (Google + GitHub buttons), `/projects` (stub with Settings link), `/settings/credentials`.
- **API routes** — `/api/auth/[...nextauth]`, `/api/credentials` (GET/POST/DELETE), `/api/credentials/revalidate` (POST).
- **Crypto** — `src/lib/crypto.ts`: AES-256-GCM via `node:crypto` using the auto-generated key.
- **Worker endpoints** — `/health`, `/tinker/validate` (live), `/jobs/start`, `/jobs/{id}/status`, `/jobs/{id}/stop` (all jobs endpoints are scaffolds — see `worker/job_runner.py`).
- **Schema** — 9 tables in `prisma/schema.prisma`. Auth (User/Account/Session/VerificationToken) + domain (TinkerCredential, Project, DataSource, TrainingJob, JobMetric). Initial migration committed at `prisma/migrations/0_init/`.
- **`proxy.ts`** (Next.js 16) — redirects unauthenticated traffic to `/login`. Page-level `auth()` checks back this up (defense in depth).

## Where we are right now

We just landed the **Tinker credentials** feature end-to-end:
- User pastes API key → app calls worker `/tinker/validate` → worker hits `ServiceClient().get_server_capabilities_async()` with a 20s `asyncio.wait_for` ceiling → result returned to app → key encrypted and persisted regardless of validation outcome → UI shows status, supported models on success, or a clickable error message on failure (with the billing-console URL surfaced when 402 is detected).

**Known blocker on the live account**: Tinker returns 402 (billing paused). The SDK retries silently — that's why the 20s timeout exists. Once the user adds payment at `https://tinker-console.thinkingmachines.ai/billing/balance`, clicking Revalidate on the settings page should succeed.

## What's next (rough order)

1. **Projects CRUD** — pages and API for `Project { name, description, baseModel, status }`. The `baseModel` dropdown should populate from `/tinker/validate` (cache the supported_models server-side).
2. **Data sources** — file upload (volume `easetinker_uploads` is already mounted at `/data/uploads`) and URL ingestion. Phase 2 will add Google Drive + SharePoint.
3. **Training jobs UI** — form for LoRA params, Start button that calls worker, polling for status.
4. **Worker real implementation** — `worker/job_runner.py` is a scaffold that simulates training. Replace with real Tinker SDK calls (forward_backward_async, optim_step_async, save_state). The full call shape is commented in the file.
5. **Loss charts** — render `JobMetric` timeseries (probably Recharts).
6. **Polish** — dashboard layout with proper nav (the current `/projects → /settings` link is a stub), error toasts, empty states.

`ROADMAP.md` tracks technical follow-ups; CLAUDE.md is the product/state pointer.

## Conventions to follow

- **Server-side auth on every protected page** — call `auth()` and redirect to `/login` if no `session?.user`. Don't rely on the middleware/proxy alone. (We learned this when middleware deprecation in Next 16 silently dropped protection.)
- **`pnpm exec prisma`, never `npx prisma`** — `npx` silently pulls the registry's latest, which has been Prisma 7 (we're pinned to 6). The migration command in the deploy flow goes through the entrypoint for the same reason.
- **Secrets only via the volume, never `.env`** — if you need a new technical secret, add it to `docker/init-secrets.sh` and `docker/docker-entrypoint.sh`, not to `.env.example`.
- **`.tmp-*` files are gitignored** — use them for transient scripts uploaded to the server.
- **Line endings** — `.gitattributes` pins shell scripts and compose files to LF so Windows clones don't break Linux shebangs. Don't undo this.

## Quick references

- Repo: https://github.com/danielbfs/easetinker
- Releases: https://github.com/danielbfs/easetinker/releases (v0.1.0 is the first production-ready cut)
- Prod URL: https://easetinker.sigame.tec.br
- Tinker docs: https://tinker-docs.thinkingmachines.ai/tinker/api-reference/serviceclient/
- Server SSH: `root@2.24.98.243` (password is in the user's vault, not here)
