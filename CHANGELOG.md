# Changelog

All notable changes to EaseTinker will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> **[Leia em Português 🇧🇷](#changelog-pt-br)**

---

## [Unreleased]

### Added
- Community files: LICENSE (MIT), CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, CHANGELOG
- GitHub issue and PR templates
- Bilingual documentation (English + Portuguese)
- `src/lib/utils.ts` with `cn()` utility (clsx + tailwind-merge)
- Projects placeholder page (`/projects`)

---

## [0.1.0] — 2025-05-13

### Added
- Initial project scaffold with Next.js 16, React 19, TypeScript 5
- NextAuth v5 authentication with Google and GitHub OAuth providers
- Prisma ORM with PostgreSQL — full data model (Projects, DataSources, TrainingJobs, JobMetrics, TinkerCredentials)
- Python FastAPI worker scaffold with Redis-backed job orchestration
- Docker Compose production setup with Traefik integration (SSL, security headers)
- Docker Compose development setup (PostgreSQL + Redis only)
- Multi-stage Dockerfiles for Next.js and Python worker (non-root users)
- AES-256-GCM encryption for Tinker API keys at rest
- Next.js middleware for route protection
- Redis pub/sub for real-time training metrics

---

---

# Changelog (PT-BR)

> **[Read in English 🇺🇸](#changelog)**

Todas as mudanças notáveis no EaseTinker serão documentadas neste arquivo.

---

## [Não Lançado]

### Adicionado
- Arquivos de comunidade: LICENSE (MIT), CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, CHANGELOG
- Templates de issue e PR para o GitHub
- Documentação bilíngue (Inglês + Português)
- `src/lib/utils.ts` com utilitário `cn()` (clsx + tailwind-merge)
- Página placeholder de projetos (`/projects`)

---

## [0.1.0] — 2025-05-13

### Adicionado
- Scaffold inicial com Next.js 16, React 19, TypeScript 5
- Autenticação NextAuth v5 com provedores OAuth Google e GitHub
- ORM Prisma com PostgreSQL — modelo de dados completo (Projects, DataSources, TrainingJobs, JobMetrics, TinkerCredentials)
- Scaffold do worker Python FastAPI com orquestração de jobs via Redis
- Docker Compose para produção com integração Traefik (SSL, headers de segurança)
- Docker Compose para desenvolvimento (apenas PostgreSQL + Redis)
- Dockerfiles multi-stage para Next.js e worker Python (usuários não-root)
- Criptografia AES-256-GCM para API keys do Tinker em repouso
- Middleware Next.js para proteção de rotas
- Redis pub/sub para métricas de treinamento em tempo real
