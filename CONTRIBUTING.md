# Contributing to EaseTinker

> **[Leia em Português 🇧🇷](#contribuindo-para-o-easetinker)**

Thank you for your interest in contributing to EaseTinker! We welcome all kinds of contributions — bug reports, feature requests, documentation improvements, and code changes.

---

## How to Contribute

### Reporting Bugs

1. Search [existing issues](https://github.com/danielbfs/easetinker/issues) to avoid duplicates.
2. Open a [bug report](https://github.com/danielbfs/easetinker/issues/new?template=bug_report.yml) with:
   - A clear title and description
   - Steps to reproduce
   - Expected vs. actual behavior
   - Environment details (OS, Docker version, browser)

### Requesting Features

1. Search [existing issues](https://github.com/danielbfs/easetinker/issues) first.
2. Open a [feature request](https://github.com/danielbfs/easetinker/issues/new?template=feature_request.yml) describing the problem it solves and the proposed solution.

### Submitting Code

1. **Fork** the repository and create a branch from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```

2. **Follow the code style:**
   - TypeScript strict mode is required
   - Run `pnpm lint` before committing
   - Keep components small and focused
   - No comments unless the *why* is non-obvious

3. **Commit messages** follow [Conventional Commits](https://www.conventionalcommits.org):
   ```
   feat: add Google Drive data source
   fix: resolve worker crash on empty dataset
   docs: update Hostinger deploy steps
   ```

4. **Open a Pull Request** against `main` with:
   - A clear description of what changed and why
   - Steps to test the change
   - Screenshots for UI changes

### Development Setup

See the [Local Development](README.md#local-development) section in the README.

---

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to uphold these standards.

---

---

# Contribuindo para o EaseTinker

> **[Read in English 🇺🇸](#contributing-to-easetinker)**

Obrigado pelo interesse em contribuir com o EaseTinker! Aceitamos todos os tipos de contribuição — bug reports, sugestões de funcionalidades, melhorias na documentação e alterações no código.

---

## Como Contribuir

### Reportando Bugs

1. Pesquise as [issues existentes](https://github.com/danielbfs/easetinker/issues) para evitar duplicatas.
2. Abra um [bug report](https://github.com/danielbfs/easetinker/issues/new?template=bug_report.yml) com:
   - Título e descrição claros
   - Passos para reproduzir
   - Comportamento esperado vs. observado
   - Detalhes do ambiente (OS, versão do Docker, navegador)

### Solicitando Funcionalidades

1. Pesquise as [issues existentes](https://github.com/danielbfs/easetinker/issues) primeiro.
2. Abra um [feature request](https://github.com/danielbfs/easetinker/issues/new?template=feature_request.yml) descrevendo o problema que resolve e a solução proposta.

### Enviando Código

1. **Fork** o repositório e crie uma branch a partir de `main`:
   ```bash
   git checkout -b feat/nome-da-sua-feature
   ```

2. **Siga o estilo de código:**
   - TypeScript em modo strict é obrigatório
   - Execute `pnpm lint` antes de commitar
   - Mantenha componentes pequenos e focados
   - Sem comentários, a não ser que o *porquê* seja não óbvio

3. **Mensagens de commit** seguem [Conventional Commits](https://www.conventionalcommits.org):
   ```
   feat: adicionar fonte de dados Google Drive
   fix: corrigir crash do worker com dataset vazio
   docs: atualizar passos de deploy na Hostinger
   ```

4. **Abra um Pull Request** contra `main` com:
   - Descrição clara do que mudou e por quê
   - Passos para testar a mudança
   - Screenshots para mudanças na UI

### Configuração de Desenvolvimento

Veja a seção [Desenvolvimento Local](docs/README.pt-BR.md#desenvolvimento-local) no README.

---

## Código de Conduta

Este projeto segue o [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). Ao participar, você concorda em manter esses padrões.
