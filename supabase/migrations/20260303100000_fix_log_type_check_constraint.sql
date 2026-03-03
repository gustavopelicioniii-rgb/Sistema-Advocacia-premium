-- Fix: Atualizar CHECK constraint em process_monitor_logs para incluir 'callback_recebido'
-- A migração anterior (20260303000000) foi corrigida mas já tinha sido aplicada sem este fix.
ALTER TABLE process_monitor_logs DROP CONSTRAINT IF EXISTS process_monitor_logs_log_type_check;
ALTER TABLE process_monitor_logs ADD CONSTRAINT process_monitor_logs_log_type_check
  CHECK (log_type IN ('consulta_realizada', 'atualizacao_encontrada', 'erro_api', 'callback_recebido'));
