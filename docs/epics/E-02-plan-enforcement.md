# EPIC E-02 — Plan Enforcement Server-Side

**Prioridade:** 🔴 CRÍTICO | **Sprint:** 1

## Problema

Os limites de plano (start: 40, pro: 100, elite: 250 processos) são verificados **somente no frontend** dentro da `mutationFn` de `useCreateProcesso`. Qualquer usuário pode bypassar esse limite usando a API do Supabase diretamente, o Supabase Studio, ou simplesmente desabilitando o JavaScript.

Além disso, a lógica faz 2 queries sequenciais (profile + count) antes do insert, criando uma potencial race condition.

## Objetivo

Enforçar limites de plano no servidor via PostgreSQL trigger + função, tornando o bypass impossível independente de como o dado é inserido.

## Escopo

### ✅ IN SCOPE

- Criar função PostgreSQL que valida limite de plano antes de INSERT em `processos`
- Criar trigger `BEFORE INSERT` em `processos` que chama a função
- Manter verificação no frontend como UX (feedback imediato ao usuário)
- Criar tabela `subscription_plans` com os limites (remover hardcode)
- Adicionar CHECK via RLS ou trigger para `fees` (honorários) se houver limite

### ❌ OUT OF SCOPE

- Sistema de billing completo (E-09 e futuro)
- Upgrade/downgrade de plano (fluxo Stripe — futuro)

## Acceptance Criteria

- [ ] Trigger `check_process_plan_limit` existe em `processos` (BEFORE INSERT)
- [ ] Tentar inserir via `supabase.from('processos').insert(...)` além do limite retorna erro PostgreSQL
- [ ] Erro é capturado pelo frontend e exibe mensagem amigável
- [ ] Tabela `subscription_plans` existe com: `plan_name`, `process_limit`, `fee_limit`
- [ ] Migration versionada em `supabase/migrations/`
- [ ] Teste de integração: insert direto via Supabase client além do limite falha
- [ ] Sem race condition: o check é atômico no banco

## Stories

- [ ] [2.1] Criar tabela `subscription_plans` e migrar valores hardcoded
- [ ] [2.2] Criar função PostgreSQL `fn_check_process_limit(owner_id, plan)`
- [ ] [2.3] Criar trigger BEFORE INSERT em `processos`
- [ ] [2.4] Atualizar `useCreateProcesso` para tratar erro do trigger gracefully
- [ ] [2.5] Simplificar `useProcessPlanLimit` hook (remover double-query)
- [ ] [2.6] Teste de integração para enforcement server-side

## Arquivos Impactados

- `supabase/migrations/YYYYMMDD_plan_enforcement.sql` — NOVO
- `src/hooks/useProcessos.ts` — simplificar `useCreateProcesso` (linhas 87-103)
- `src/hooks/useProfile.ts` — ler limits de `subscription_plans` em vez de hardcode

## Riscos

- Trigger pode afetar performance de INSERT (negligível com < 1000 processos/usuário)
- Precisamos garantir que admin pode criar processos para qualquer tenant (override)
