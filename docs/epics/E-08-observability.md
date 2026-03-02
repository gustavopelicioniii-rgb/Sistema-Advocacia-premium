# EPIC E-08 — Observabilidade e Audit Logs

**Prioridade:** 🟡 MEDIUM | **Sprint:** 4

## Problema

- Erros de produção são invisíveis (sem Sentry ou similar)
- Edge Functions têm logs estruturados (`logStructured`) mas o frontend não
- Não há correlation ID para rastrear uma requisição ponta a ponta
- Sem métricas de uso por feature/tenant
- Sem health check endpoint

## Objetivo

Implementar observabilidade real: rastrear erros em produção, correlacionar logs entre frontend e Edge Functions, e preparar o sistema para monitoramento enterprise.

## Acceptance Criteria

- [ ] Sentry configurado no frontend (captura JS errors + React error boundaries)
- [ ] Sentry configurado nas Edge Functions (captura erros Deno)
- [ ] Correlation ID gerado por requisição e propagado do frontend para Edge Functions
- [ ] `ErrorBoundary` atualizado para reportar ao Sentry com contexto do usuário
- [ ] Logs estruturados no frontend para erros críticos (não apenas `console.error`)
- [ ] Endpoint `/api/health` ou Supabase Edge Function `health-check` ativa
- [ ] Dashboard básico de erros no Sentry com alertas configurados

## Stories

### Sentry

- [ ] [8.1] Instalar `@sentry/react` e configurar DSN via env var
- [ ] [8.2] Atualizar `ErrorBoundary.tsx` para reportar ao Sentry com user context
- [ ] [8.3] Configurar Sentry nas Edge Functions (Deno SDK)
- [ ] [8.4] Criar alertas no Sentry: error rate > 5% ou novos issues críticos

### Correlation ID

- [ ] [8.5] Criar `src/lib/correlationId.ts` — gerar UUID por "sessão de operação"
- [ ] [8.6] Propagar correlation ID no header `X-Correlation-ID` para Edge Functions
- [ ] [8.7] Edge Functions incluem correlation ID nos logs estruturados

### Structured Logging Frontend

- [ ] [8.8] Criar `src/lib/logger.ts` com níveis: `info`, `warn`, `error`
- [ ] [8.9] Substituir `console.error` por `logger.error` nos hooks críticos
- [ ] [8.10] Integrar `logger.error` com Sentry (erros capturados automaticamente)

### Health Check

- [ ] [8.11] Criar Edge Function `health-check` que verifica DB connectivity
- [ ] [8.12] Documentar endpoint para uso em UptimeRobot ou similar

### Env Vars

- [ ] [8.13] Adicionar `VITE_SENTRY_DSN` ao `.env.example`
- [ ] [8.14] Adicionar `SENTRY_DSN` à config das Edge Functions

## Arquivos Criados/Modificados

- `src/lib/logger.ts` — NOVO
- `src/lib/correlationId.ts` — NOVO
- `src/components/ErrorBoundary.tsx` — atualizar com Sentry
- `supabase/functions/health-check/index.ts` — NOVO
- `package.json` — adicionar `@sentry/react`
- `.env.example` — adicionar `VITE_SENTRY_DSN`

## Métricas de Sucesso

- MTTR (Mean Time to Resolve) de erros de produção < 24h (hoje: indefinido)
- 100% dos erros JS capturados pelo Sentry
- Correlation ID presente em 100% dos logs de Edge Functions
