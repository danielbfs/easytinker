# Security Policy

> **[Leia em Português 🇧🇷](#política-de-segurança)**

## Supported Versions

| Version | Supported |
|---------|-----------|
| latest (`main`) | Yes |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

If you discover a security vulnerability in EaseTinker, please send an email to **danielbfs@gmail.com** with:

- A description of the vulnerability
- Steps to reproduce it
- Potential impact
- Suggested fix (if any)

You will receive a response within **72 hours** acknowledging your report. We will work with you to understand and address the issue, and will credit you in the release notes unless you prefer to remain anonymous.

## Security Considerations for Self-Hosting

When deploying EaseTinker on your own server:

- **Never commit your `.env` file** — it contains secrets that grant full access to your instance.
- **Rotate secrets regularly** — especially `NEXTAUTH_SECRET`, `ENCRYPTION_KEY`, and `WORKER_SECRET`.
- **Keep Docker images updated** — run `docker compose pull` periodically to get security patches.
- **Restrict VPS access** — use SSH keys, disable password authentication, and configure a firewall.
- **Keep Traefik updated** — it handles your SSL termination and external traffic.

---

---

# Política de Segurança

> **[Read in English 🇺🇸](#security-policy)**

## Versões Suportadas

| Versão | Suportada |
|--------|-----------|
| latest (`main`) | Sim |

## Reportando uma Vulnerabilidade

**Por favor, não reporte vulnerabilidades de segurança através de issues públicas no GitHub.**

Se você descobrir uma vulnerabilidade de segurança no EaseTinker, envie um e-mail para **danielbfs@gmail.com** com:

- Descrição da vulnerabilidade
- Passos para reproduzi-la
- Impacto potencial
- Correção sugerida (se houver)

Você receberá uma resposta em até **72 horas** confirmando o recebimento do seu relatório. Trabalharemos com você para entender e corrigir o problema, e daremos crédito nas notas de versão, a menos que prefira permanecer anônimo.

## Considerações de Segurança para Self-Hosting

Ao fazer o deploy do EaseTinker no seu próprio servidor:

- **Nunca commite o arquivo `.env`** — ele contém secrets que concedem acesso total à sua instância.
- **Rotacione os secrets regularmente** — especialmente `NEXTAUTH_SECRET`, `ENCRYPTION_KEY` e `WORKER_SECRET`.
- **Mantenha as imagens Docker atualizadas** — execute `docker compose pull` periodicamente para receber patches de segurança.
- **Restrinja o acesso ao VPS** — use chaves SSH, desabilite autenticação por senha e configure um firewall.
- **Mantenha o Traefik atualizado** — ele gerencia a terminação SSL e o tráfego externo.
