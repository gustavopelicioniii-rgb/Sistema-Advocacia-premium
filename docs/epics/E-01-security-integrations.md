# EPIC E-01 — Segurança: Integrações Externas via Edge Functions

**Prioridade:** 🔴 CRÍTICO | **Sprint:** 1

## Problema

O token da API Escavador (`VITE_ESCAVADOR_API_TOKEN`) está sendo lido pelo frontend via `import.meta.env`, o que o expõe no bundle JavaScript entregue ao browser. Qualquer usuário pode inspecionar o token. O Google Calendar Client ID está armazenado em `localStorage`.

## Objetivo

Mover 100% das chamadas a APIs externas para Supabase Edge Functions (Deno), onde os tokens vivem apenas em variáveis de ambiente do servidor.

## Escopo

### ✅ IN SCOPE

- Mover chamadas Escavador do browser para Edge Function dedicada
- Criar Edge Function `escavador-proxy` que o frontend chama (sem expor token)
- Mover Google Calendar Client ID para variável de ambiente
- Remover `VITE_ESCAVADOR_API_TOKEN` do `.env.example` e do código frontend
- Atualizar `processMonitor.ts` e hooks relacionados

### ❌ OUT OF SCOPE

- Refatorar lógica de negócio do monitor (E-04 cuida disso)
- OpenAI/Google AI Studio (não implementado ainda)

## Acceptance Criteria

- [ ] `VITE_ESCAVADOR_API_TOKEN` não existe mais em nenhum arquivo `.env*` ou código frontend
- [ ] Busca de movimentações Escavador passa por Edge Function `escavador-proxy`
- [ ] Edge Function valida `Authorization: Bearer <supabase_anon_token>` antes de repassar
- [ ] Sem token no bundle: `npm run build && grep -r "ESCAVADOR" dist/` retorna vazio
- [ ] Google Calendar Client ID lido de env var (não localStorage)
- [ ] Testes da Edge Function com mock da API Escavador

## Stories

- [ ] [1.1] Criar Edge Function `escavador-proxy` com autenticação Supabase
- [ ] [1.2] Atualizar `src/hooks/useProcessMonitorLogs.ts` para chamar Edge Function
- [ ] [1.3] Remover `VITE_ESCAVADOR_API_TOKEN` de todo o código frontend
- [ ] [1.4] Mover Google Calendar Client ID para variável de ambiente
- [ ] [1.5] Atualizar `.env.example` com variáveis corretas documentadas
- [ ] [1.6] Teste de segurança: verificar bundle não contém tokens

## Arquivos Impactados

- `src/lib/escavador.ts` — remover lógica de token frontend
- `src/hooks/useProcessMonitorLogs.ts` — nova chamada para Edge Function
- `supabase/functions/escavador-proxy/index.ts` — NOVO
- `src/hooks/useGoogleCalendar.ts` — remover localStorage para Client ID
- `.env.example` — atualizar documentação
- `supabase/config.toml` — registrar nova Edge Function

## Riscos

- A Edge Function precisa repassar o tenant context (user JWT) para garantir isolamento
- Rate limit da API Escavador deve ser respeitado por tenant (não global)
