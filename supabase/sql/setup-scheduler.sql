-- Configurar scheduler para verificacao automatica de movimentacoes
-- Executa 1x/dia as 09:00 UTC (06:00 Brasilia)

-- Habilitar extensao pg_cron (se disponivel no seu plano Supabase)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Criar funcao que chama a Edge Function
CREATE OR REPLACE FUNCTION verificar_movimentacoes_diario()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Atualizar last_checked_at para processos que precisam ser verificados (> 24h)
  -- A Edge Function fara a verificacao real na proxima execucao
  PERFORM net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/verificar-movimentacoes',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.anon_key')
    ),
    body := '{}'::jsonb
  );
END;
$$;

-- NOTA: Se pg_cron estiver disponivel, descomente a linha abaixo:
-- SELECT cron.schedule('verificar-movimentacoes', '0 9 * * *', 'SELECT verificar_movimentacoes_diario()');

-- Alternativa simples: criar view para processos que precisam verificacao
CREATE OR REPLACE VIEW processos_para_verificar AS
SELECT id, numero_processo, tribunal, last_checked_at
FROM processos
WHERE ativo = true
AND (last_checked_at IS NULL OR last_checked_at < NOW() - INTERVAL '24 hours');
