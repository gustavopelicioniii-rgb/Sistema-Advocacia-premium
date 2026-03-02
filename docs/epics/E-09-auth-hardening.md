# EPIC E-09 — Auth & Authorization Hardening

**Prioridade:** 🟡 MEDIUM | **Sprint:** 4

## Problema

### 1. Role pode ficar stale entre sessões

O role do usuário é buscado do banco no login e armazenado em contexto React. Se um admin atualizar o role de outro usuário, esse usuário não verá a mudança até relogar.

### 2. Admin vê dados sensíveis de todos os profiles

A política `profiles_read_all_for_team` permite admin ler todos os campos de profile, incluindo CPF, endereço, CEP. Não há field-level RLS.

### 3. RBAC não granular para permissões de módulo

A tabela `user_permissions` existe mas não há enforcement automático — cada componente verifica permissões individualmente de forma inconsistente.

### 4. Sem histórico de sessões / audit de login

Não há log de "user X fez login às Y horas de Z endereço".

### 5. Sem suporte a 2FA

Supabase suporta TOTP mas não está habilitado.

## Objetivo

Tornar autenticação e autorização robustas: role sync em tempo real, permissões centralizadas e enforçadas, e base para 2FA futuro.

## Acceptance Criteria

- [ ] Role do usuário sincroniza via Supabase Realtime sem necessidade de reload
- [ ] Admin lê apenas campos não-sensíveis de outros profiles via view pública
- [ ] Middleware centralizado de permissões substitui verificações dispersas
- [ ] `usePermissions` hook unificado para checar acesso a módulos
- [ ] Audit log de login/logout via Supabase Auth Hooks
- [ ] Documentação do modelo de permissões atualizada

## Stories

### Role Sync Realtime

- [ ] [9.1] Implementar Supabase Realtime subscription em `AuthContext` para mudanças no próprio profile
- [ ] [9.2] Ao detectar mudança de role, atualizar contexto sem reload
- [ ] [9.3] Teste: role atualizado por admin reflete em < 5s na sessão do usuário

### Field-Level Privacy

- [ ] [9.4] Criar view `profiles_public` com apenas campos não-sensíveis (sem CPF, CEP, endereço completo)
- [ ] [9.5] Atualizar política de leitura de admin para usar `profiles_public`
- [ ] [9.6] Manter acesso completo apenas para o próprio usuário (self-read)

### RBAC Centralizado

- [ ] [9.7] Criar `src/lib/permissions.ts` com mapa de permissões por role e módulo
- [ ] [9.8] Criar hook `usePermissions(module)` que retorna `{ canRead, canWrite, canDelete }`
- [ ] [9.9] Substituir verificações ad-hoc de role espalhadas pelos componentes
- [ ] [9.10] `PermissionRedirect.tsx` usar o novo hook `usePermissions`

### Audit de Auth

- [ ] [9.11] Criar Supabase Auth Hook (Webhook) para capturar eventos de login/logout
- [ ] [9.12] Gravar eventos em tabela `auth_events` (`user_id`, `event_type`, `ip`, `user_agent`, `timestamp`)
- [ ] [9.13] RLS em `auth_events`: user vê próprios, admin vê todos

## Arquivos Impactados

- `src/contexts/AuthContext.tsx` — realtime subscription
- `src/lib/permissions.ts` — NOVO
- `src/hooks/usePermissions.ts` — NOVO
- `src/components/PermissionRedirect.tsx` — usar novo hook
- `supabase/migrations/YYYYMMDD_profiles_public_view.sql` — NOVO
- `supabase/migrations/YYYYMMDD_auth_events.sql` — NOVO

## Notas

- 2FA via TOTP pode ser habilitado no Supabase Dashboard (sem código) — avaliar como feature de plano Pro/Elite
- JWT custom claims para role (eliminar query extra ao banco) é evolução futura
