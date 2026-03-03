-- Insert 3 processos iniciais para monitoramento
-- Executar este script no Supabase SQL Editor

INSERT INTO processos (
  numero_processo,
  tribunal,
  ultima_movimentacao,
  ultima_movimentacao_data,
  last_checked_at,
  ativo,
  created_at,
  updated_at
) VALUES
(
  '1000484-17.2024.8.26.0338',
  'SP',
  'Processual - Aguardando próxima etapa',
  NOW(),
  NOW(),
  true,
  NOW(),
  NOW()
),
(
  '0000312-21.2026.8.26.0048',
  'SP',
  'Em andamento - Execução de alimentos',
  NOW(),
  NOW(),
  true,
  NOW(),
  NOW()
),
(
  '0000313-06.2026.8.26.0048',
  'SP',
  'Em andamento - Execução de alimentos',
  NOW(),
  NOW(),
  true,
  NOW(),
  NOW()
);

-- Verificar inserção
SELECT numero_processo, tribunal, ativo, created_at FROM processos ORDER BY created_at DESC LIMIT 3;
