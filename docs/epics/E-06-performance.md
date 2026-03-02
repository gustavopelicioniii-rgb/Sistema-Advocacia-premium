# EPIC E-06 — Performance: Paginação e Queries

**Prioridade:** 🟡 HIGH | **Sprint:** 3

## Problema

### 1. Fetch sem paginação (maior risco)

```typescript
// useProcessos.ts:42 — busca até 500 registros de uma vez
.range(0, 499);
```

Com crescimento: 500 processos × campos JSON = payload enorme. Filtragem e sorting no cliente.

### 2. N+1 em drag-and-drop do CRM

```typescript
// useCrm.ts:150-157 — N queries individuais via Promise.all
const promises = updates.map(({ id, stage_id, position }) =>
    supabase.from("crm_clients").update({ stage_id, position }).eq("id", id),
);
```

Mover 10 cards = 10 queries. Deveria ser 1 `upsert` em batch.

### 3. Dashboard sobrecarregado no mount

Dashboard.tsx dispara 6+ queries simultâneas no load inicial:

- `useProcessos` → processos
- `useFees` → honorários
- `useDeadlinesStats` → prazos
- `useCrmClients` → clientes CRM
- `useCrmStages` → stages CRM
- `useProfile` → perfil

### 4. Indexes ausentes

Colunas de filtro frequente sem index documentado:

- `processos.owner_id`
- `processos.status`
- `fees.owner_id`
- `fees.status`
- `deadlines.next_deadline`

## Objetivo

Implementar paginação server-side, batch updates, e indexes para garantir performance com 10x crescimento de dados.

## Acceptance Criteria

- [ ] `useProcessos` implementa cursor-based pagination (page size: 20)
- [ ] Lista de processos tem scroll infinito ou paginação UI
- [ ] Batch update de posições no CRM usa `upsert` com array (1 query)
- [ ] Dashboard carrega dados críticos first (processos + prazos), dados secundários lazy
- [ ] Migration com indexes em `owner_id`, `status`, `next_deadline`
- [ ] `EXPLAIN ANALYZE` mostra Seq Scan → Index Scan nas queries principais
- [ ] Tempo de carregamento inicial do Dashboard < 2s em 100 processos

## Stories

### Paginação

- [ ] [6.1] Implementar `useProcessosPaginated` com cursor pagination
- [ ] [6.2] Atualizar `Processos.tsx` — UI de paginação ou scroll infinito
- [ ] [6.3] Implementar paginação em `useFees` (honorários)
- [ ] [6.4] Implementar paginação em `useCrmClients`

### N+1 Fix

- [ ] [6.5] Refatorar `useBatchUpdateClientPositions` — usar `upsert` array batch

### Dashboard Optimization

- [ ] [6.6] Criar `useDashboardStats` — query agregada única para stats do dashboard
- [ ] [6.7] Implementar lazy loading para `AiRecommendation` e `ProcessMonitorResults`
- [ ] [6.8] Separar queries críticas (prazos urgentes) das secundárias (CRM pipeline)

### Database Indexes

- [ ] [6.9] Migration: indexes em `processos` (`owner_id`, `status`, `next_deadline`)
- [ ] [6.10] Migration: indexes em `fees` (`owner_id`, `status`, `due_date`)
- [ ] [6.11] Migration: indexes em `deadlines` (`owner_id`, `process_id`)
- [ ] [6.12] Verificar query plans com `EXPLAIN ANALYZE`

## Arquivos Impactados

- `src/hooks/useProcessos.ts` — adicionar paginação
- `src/hooks/useFees.ts` — adicionar paginação
- `src/hooks/useCrm.ts` — refatorar batch update
- `src/pages/Processos.tsx` — UI de paginação
- `src/pages/Financeiro.tsx` — UI de paginação
- `src/pages/Dashboard.tsx` — lazy loading
- `supabase/migrations/YYYYMMDD_performance_indexes.sql` — NOVO

## Estimativa de Impacto

- 500 processos → 20 por página: redução de 96% no payload inicial
- N+1 CRM: 10 queries → 1 query (batch upsert)
- Dashboard: 6 queries → 2 queries (crítico + lazy)
