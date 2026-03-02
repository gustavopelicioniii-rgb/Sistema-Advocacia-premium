-- =============================================================================
-- E-09: Audit Log de Autenticação — tabela auth_events
-- =============================================================================
-- Captura eventos de login/logout via Supabase Auth Webhook.
-- A Edge Function `auth-webhook` recebe os eventos e insere aqui via service_role.
--
-- Configuração (Supabase Dashboard):
--   Authentication → Hooks → "Send auth events to webhook"
--   URL: https://<projeto>.supabase.co/functions/v1/auth-webhook
--   Secret: defina em SUPABASE_WEBHOOK_SECRET (Edge Function Secrets)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.auth_events (
    id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at  TIMESTAMPTZ DEFAULT now()             NOT NULL,
    user_id     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
    event_type  TEXT        NOT NULL,    -- 'login', 'logout', 'token_refreshed', 'password_recovery', etc.
    ip_address  TEXT,
    user_agent  TEXT,
    metadata    JSONB       DEFAULT '{}'
);

-- Índices para queries comuns
CREATE INDEX IF NOT EXISTS idx_auth_events_user_id    ON public.auth_events(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_events_created_at ON public.auth_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auth_events_event_type ON public.auth_events(event_type);

COMMENT ON TABLE public.auth_events IS
    'E-09: Audit log de eventos de autenticação. '
    'Populado pela Edge Function auth-webhook via Supabase Auth Hooks.';

COMMENT ON COLUMN public.auth_events.event_type IS
    'Tipo do evento: login, logout, token_refreshed, password_recovery, signup, etc.';

-- RLS
ALTER TABLE public.auth_events ENABLE ROW LEVEL SECURITY;

-- Usuários veem apenas os próprios eventos
CREATE POLICY "Users read own auth events" ON public.auth_events
    FOR SELECT
    USING (auth.uid() = user_id);

-- Admin vê todos os eventos (via is_admin() para evitar recursão)
CREATE POLICY "Admins read all auth events" ON public.auth_events
    FOR SELECT
    USING (public.is_admin());

-- INSERT: apenas service_role (Edge Function auth-webhook) — service_role bypassa RLS
-- Nenhuma política de INSERT é necessária; sem ela, usuários comuns não podem inserir.
-- Service_role bypassa RLS automaticamente no Supabase.

COMMENT ON POLICY "Users read own auth events" ON public.auth_events IS
    'Usuários veem apenas os próprios eventos de login/logout.';

COMMENT ON POLICY "Admins read all auth events" ON public.auth_events IS
    'Administradores veem todos os eventos de autenticação (auditoria).';
