-- ============================================================================
-- Migration: Escavador V2 — Event-Driven Architecture
-- Descrição: Migra do modelo de polling diário para arquitetura orientada a
--            eventos usando callbacks nativos da API v2 do Escavador.
-- ============================================================================

-- 1.1 — Novas colunas em `processos`
ALTER TABLE processos ADD COLUMN IF NOT EXISTS escavador_update_id BIGINT;
ALTER TABLE processos ADD COLUMN IF NOT EXISTS status_atualizacao TEXT DEFAULT 'NONE'
  CHECK (status_atualizacao IN ('NONE','PENDING','SUCCESS','ERROR','NOT_FOUND'));
ALTER TABLE processos ADD COLUMN IF NOT EXISTS ultima_movimentacao_hash TEXT;
ALTER TABLE processos ADD COLUMN IF NOT EXISTS monitoramento_ativo BOOLEAN DEFAULT false;
ALTER TABLE processos ADD COLUMN IF NOT EXISTS ultima_verificacao TIMESTAMPTZ;

-- 1.2 — Tabela de auditoria de callbacks
CREATE TABLE IF NOT EXISTS escavador_callback_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  callback_id BIGINT,
  callback_uuid TEXT,
  evento TEXT,
  status TEXT,
  numero_cnj TEXT,
  payload JSONB,
  processing_result TEXT,  -- 'processed', 'duplicate', 'error', 'ignored'
  error_message TEXT,
  processed_at TIMESTAMPTZ
);

-- RLS: service_role only (edge functions)
ALTER TABLE escavador_callback_logs ENABLE ROW LEVEL SECURITY;
-- Nenhuma policy para anon/authenticated — apenas service_role acessa

-- Índice para busca por callback_uuid (deduplicação)
CREATE INDEX IF NOT EXISTS idx_escavador_callback_logs_uuid
  ON escavador_callback_logs (callback_uuid);

-- Índice para busca por numero_cnj
CREATE INDEX IF NOT EXISTS idx_escavador_callback_logs_cnj
  ON escavador_callback_logs (numero_cnj);

-- 1.3 — Constraint única para idempotência em process_movements
CREATE UNIQUE INDEX IF NOT EXISTS idx_process_movements_external_id_process
  ON process_movements (process_id, external_id)
  WHERE external_id IS NOT NULL;

-- 1.4 — Atualizar CHECK constraint em process_monitor_logs para incluir 'callback_recebido'
ALTER TABLE process_monitor_logs DROP CONSTRAINT IF EXISTS process_monitor_logs_log_type_check;
ALTER TABLE process_monitor_logs ADD CONSTRAINT process_monitor_logs_log_type_check
  CHECK (log_type IN ('consulta_realizada', 'atualizacao_encontrada', 'erro_api', 'callback_recebido'));

-- 1.5 — Índice para busca de processos por status_atualizacao (health-check)
CREATE INDEX IF NOT EXISTS idx_processos_status_atualizacao
  ON processos (status_atualizacao)
  WHERE status_atualizacao IN ('PENDING', 'ERROR');
