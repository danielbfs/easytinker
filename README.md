# 🧠 EaseTinker

**Orchestrador visual de fine-tuning de LLMs via Tinker SDK (ThinkingMachines)**

EaseTinker é uma aplicação web que simplifica o processo de fine-tuning de modelos de linguagem usando a plataforma [Tinker](https://tinker-docs.thinkingmachines.ai). Sem escrever código Python, o usuário configura, lança e monitora jobs de treinamento diretamente pelo navegador.

---

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Arquitetura](#-arquitetura)
- [Pré-requisitos](#-pré-requisitos)
- [Deploy em Produção (Hostinger VPS)](#-deploy-em-produção-hostinger-vps)
- [Instalação Local (Desenvolvimento)](#-instalação-local-desenvolvimento)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)

---

## 🎯 Visão Geral

O Tinker SDK é poderoso para fine-tuning de LLMs, mas requer conhecimento de Python, gerenciamento manual de loops de treinamento, e monitoramento por terminal.

O **EaseTinker** oferece uma interface web intuitiva para orquestrar tudo isso de forma visual. O usuário apenas fornece a sua API Key do [Tinker Console](https://tinker-console.thinkingmachines.ai) e a aplicação cuida do resto, gerenciando datasets, hiperparâmetros e monitorando o loss de treinamento em tempo real.

---

## 🏗 Arquitetura

O sistema funciona com dois serviços principais empacotados no Docker Compose:
1. **Next.js (App)**: Frontend, Autenticação, Interface e Gateway REST.
2. **Python Worker**: Comunica-se exclusivamente via rede interna com o Next.js e se conecta externamente ao Tinker Cloud via gRPC.

```text
┌──────────────────────────────────────────────────────┐
│                    VPS Hostinger                     │
│  ┌──────────┐    ┌─────────────────────────────────┐ │
│  │ Traefik  │───▶│     Docker Compose Network      │ │
│  │(Hostinger│    │  ┌───────────┐  ┌────────────┐  │ │
│  │ managed) │    │  │ Next.js   │  │  Python    │  │ │
│  └──────────┘    │  │ App :3000 │──│ Worker:8000│  │ │
│                  │  └─────┬─────┘  └─────┬──────┘  │ │
│                  │        │              │         │ │
│                  │  ┌─────┴─────┐  ┌─────┴──────┐  │ │
│                  │  │PostgreSQL │  │   Redis    │  │ │
│                  │  └───────────┘  └────────────┘  │ │
│                  └─────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

---

## 🚀 Deploy em Produção (Hostinger VPS)

A aplicação foi desenhada nativamente para ser hospedada em uma **VPS da Hostinger com Docker e Traefik**. O Traefik da Hostinger detecta os rótulos (labels) no `docker-compose.yml` e gerencia automaticamente a emissão dos certificados SSL/HTTPS.

### Passo 1: Pré-requisitos do Servidor

1. Conecte-se via SSH à sua VPS da Hostinger.
2. Certifique-se de ter um domínio apontado para o IP da sua VPS (ex: `easetinker.seudominio.com`).
3. O Traefik já deve estar instalado (padrão da imagem Docker da Hostinger).
4. Crie a rede pública do Traefik caso ela não exista:
   ```bash
   docker network create traefik-public
   ```

### Passo 2: Baixar o Repositório

No servidor da Hostinger, clone o repositório na pasta de sua escolha (ex: `/docker/easetinker`):

```bash
git clone https://github.com/danielbfs/easytinker.git /docker/easetinker
cd /docker/easetinker
```

### Passo 3: Configurar Variáveis de Ambiente

Copie o modelo e preencha as credenciais reais:

```bash
cp .env.example .env
nano .env
```

Garanta que as seguintes variáveis estejam preenchidas corretamente no `.env`:
- `APP_DOMAIN`: O seu domínio exato (ex: `easetinker.seudominio.com`). O Traefik usará isso!
- `NEXTAUTH_SECRET`: Gere com `openssl rand -base64 32`.
- `ENCRYPTION_KEY`: Gere com `openssl rand -hex 32`.
- `GOOGLE_CLIENT_ID` e `GITHUB_CLIENT_ID` para o login.
- `POSTGRES_PASSWORD`: Defina uma senha forte.

### Passo 4: Subir os Containers (Docker Compose)

Execute o build e inicialize todos os containers em modo daemon (segundo plano):

```bash
docker compose up -d --build
```

O comando irá criar 4 containers:
- `easetinker-postgres`
- `easetinker-redis`
- `easetinker-worker`
- `easetinker-app` (O único exposto ao Traefik externamente)

### Passo 5: Migrations do Banco de Dados

Com os containers em execução, aplique a estrutura do banco de dados (schema do Prisma):

```bash
docker compose exec app npx prisma migrate deploy
```

### Passo 6: Verificar Status e Logs

Verifique se todos os containers estão saudáveis (`healthy`):

```bash
docker compose ps
```

Caso algo não funcione, inspecione os logs:

```bash
docker compose logs -f app
```

Acesse o seu domínio (`https://easetinker.seudominio.com`) no navegador. O SSL deve estar configurado automaticamente pelo Traefik.

---

### Passo 7: Como Atualizar (Novo Deploy Manual)

Sempre que houver atualizações ou modificações no código pelo GitHub, conecte-se via SSH na Hostinger, vá até a pasta do projeto e rode os seguintes comandos para puxar as novidades e reiniciar os containers:

```bash
cd /docker/easetinker

# Baixa as atualizações do GitHub
git pull origin main

# Refaz o build usando cache e sobe os novos containers sem derrubar o banco
docker compose up -d --build

# (Opcional) Executa migrations caso o banco de dados tenha mudado
docker compose exec app npx prisma migrate deploy
```



## 💻 Instalação Local (Desenvolvimento)

Caso queira modificar o sistema na sua máquina antes de mandar para a Hostinger:

1. Suba apenas os serviços de apoio (DB e Redis):
   ```bash
   docker compose -f docker-compose.dev.yml up -d postgres redis
   ```
2. Instale os pacotes Node:
   ```bash
   pnpm install
   ```
3. Aplique o banco:
   ```bash
   pnpm prisma generate
   pnpm prisma migrate dev
   ```
4. Prepare o ambiente Python (Worker):
   ```bash
   cd worker
   python -m venv .venv
   .venv\Scripts\activate   # ou source .venv/bin/activate no Mac/Linux
   pip install -r requirements.txt
   ```
5. Inicie as duas camadas em terminais separados:
   - Terminal 1: `pnpm dev`
   - Terminal 2: `cd worker && uvicorn main:app --reload`
