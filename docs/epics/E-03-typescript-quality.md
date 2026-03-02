# EPIC E-03 — TypeScript Strict + Code Quality CI/CD

**Prioridade:** 🔴 HIGH | **Sprint:** 2

## Problema

- TypeScript com `strict: false` — permite `any` implícito, sem `strictNullChecks`
- Sem Husky pre-commit hooks
- Sem Prettier (formatação inconsistente)
- Sem Conventional Commits enforcement
- Sem CI/CD pipeline (GitHub Actions)
- ESLint configurado mas sem regras enterprise

## Objetivo

Implementar os guardrails de qualidade de código que bloqueiam problemas antes de chegarem a produção.

## Escopo

### ✅ IN SCOPE

- Habilitar TypeScript strict mode e corrigir todos os erros resultantes
- Configurar Prettier com `.prettierrc`
- Configurar Husky + lint-staged (lint + typecheck + format no pre-commit)
- Configurar commitlint para Conventional Commits
- Criar GitHub Actions workflow (lint + typecheck + test na PR)
- Atualizar ESLint com regras adicionais (no-explicit-any, etc.)

### ❌ OUT OF SCOPE

- Refatoração de componentes (E-04)
- Adição de testes (E-05)
- Branch protection rules (configuração GitHub — manual)

## Acceptance Criteria

- [ ] `npx tsc --strict --noEmit` passa sem erros
- [ ] `npm run lint` passa sem warnings em todos os arquivos
- [ ] `npx prettier --check .` passa
- [ ] Commit com mensagem fora do padrão Conventional Commits é bloqueado pelo Husky
- [ ] GitHub Actions roda em toda PR: lint + typecheck + test
- [ ] `npm run build` continua funcionando
- [ ] `.prettierrc` e `.prettierignore` criados
- [ ] `commitlint.config.js` criado

## Stories

- [ ] [3.1] Habilitar `strict: true` em tsconfig.json e corrigir erros de tipo
- [ ] [3.2] Instalar e configurar Prettier
- [ ] [3.3] Instalar Husky + lint-staged + commitlint
- [ ] [3.4] Criar GitHub Actions workflow `.github/workflows/ci.yml`
- [ ] [3.5] Atualizar ESLint config com regras enterprise (no-explicit-any, etc.)
- [ ] [3.6] Corrigir todos os warnings do ESLint existentes

## Arquivos Criados/Modificados

- `tsconfig.json` — `strict: true`
- `.prettierrc` — NOVO
- `.prettierignore` — NOVO
- `.husky/pre-commit` — NOVO
- `.husky/commit-msg` — NOVO
- `commitlint.config.js` — NOVO
- `.github/workflows/ci.yml` — NOVO
- `eslint.config.js` — atualizar regras
- `package.json` — adicionar devDependencies

## Estimativa de Erros TypeScript Esperados

Com base no código auditado, strict mode vai gerar ~50-100 erros relacionados a:

- `null` não tratado (ex: `profile?.subscription_plan ?? null`)
- Tipos implícitos em callbacks do Supabase
- `any` em catch blocks
- Propriedades opcionais não verificadas

## Riscos

- Strict mode pode revelar bugs latentes (bom — melhor descobrir agora)
- Processo de correção pode levar 1-2 dias de trabalho
