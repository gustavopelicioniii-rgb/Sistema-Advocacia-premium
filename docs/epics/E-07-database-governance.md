# EPIC E-07 — Database Governance

**Prioridade:** 🟡 MEDIUM | **Sprint:** 3-4

## Problema

### 1. SQL fora do sistema de migrations (18 arquivos na raiz)

```
supabase_all_modules.sql
supabase_deadlines.sql
supabase_fix.sql
supabase_inbox.sql
supabase_migration.sql
supabase_module1_processos.sql
... (18 arquivos no total)
```

Esses arquivos foram aplicados manualmente. Não há garantia de quais foram para qual ambiente.

### 2. Sem soft delete

Nenhuma tabela tem `deleted_at`. Registros deletados somem permanentemente sem histórico.

### 3. Audit fields incompletos

Tabelas têm `created_at` mas nem todas têm `updated_at`. Nenhuma tem `deleted_at` ou `updated_by`.

### 4. Sem tabela de audit trail

Nenhuma tabela registra "quem fez o quê quando" — crítico para sistema jurídico.

## Objetivo

Consolidar governance do banco de dados: todas as mudanças via migrations versionadas, soft delete onde apropriado, audit trail para operações críticas.

## Acceptance Criteria

- [ ] Todos os `supabase_*.sql` da raiz revisados e convertidos em migrations versionadas ou arquivados
- [ ] `supabase db push` aplica corretamente em ambiente limpo sem erros
- [ ] Soft delete implementado em `processos` e `fees` (`deleted_at timestamp`)
- [ ] Tabela `audit_logs` criada com: `table_name`, `operation`, `old_data`, `new_data`, `performed_by`, `performed_at`
- [ ] Triggers de audit em `processos` e `fees`
- [ ] RLS em `audit_logs`: admin vê tudo, user vê apenas seus próprios logs
- [ ] Documentação do schema atualizada

## Stories

### Consolidação de Migrations

- [ ] [7.1] Auditar os 18 arquivos SQL da raiz — identificar o que já está em migrations formais
- [ ] [7.2] Converter SQL faltante em migrations versionadas (`supabase/migrations/`)
- [ ] [7.3] Arquivar (ou deletar) arquivos `supabase_*.sql` da raiz após consolidação
- [ ] [7.4] Testar `supabase db reset` em ambiente local (aplica todas as migrations do zero)

### Soft Delete

- [ ] [7.5] Migration: adicionar `deleted_at` em `processos` + atualizar RLS
- [ ] [7.6] Migration: adicionar `deleted_at` em `fees` + atualizar RLS
- [ ] [7.7] Atualizar hooks `useDeleteProcesso` e `useDeleteFee` para soft delete
- [ ] [7.8] Criar view `processos_ativos` excluindo soft-deleted

### Audit Trail

- [ ] [7.9] Migration: criar tabela `audit_logs` com estrutura JSONB para old/new data
- [ ] [7.10] Criar função PostgreSQL `fn_audit_trigger()` genérica
- [ ] [7.11] Aplicar trigger de audit em `processos` (INSERT, UPDATE, DELETE)
- [ ] [7.12] Aplicar trigger de audit em `fees` (INSERT, UPDATE, DELETE)
- [ ] [7.13] RLS em `audit_logs`: visibilidade por `performed_by`
- [ ] [7.14] Hook `useAuditLogs` para visualização no frontend (admin only)

## Arquivos Impactados

- `supabase/migrations/YYYYMMDD_soft_delete.sql` — NOVO
- `supabase/migrations/YYYYMMDD_audit_trail.sql` — NOVO
- `supabase/migrations/YYYYMMDD_consolidation_*.sql` — NOVOs (múltiplos)
- `src/hooks/useProcessos.ts` — soft delete
- `src/hooks/useFees.ts` — soft delete
- Raiz: remover `supabase_*.sql` após migração

## Notas

- Sistema jurídico: audit trail não é opcional — é requisito de compliance
- Soft delete em processos é crítico: advocacia tem obrigação de guardar histórico
