-- REBUILD COMPLETO da tabela processos
-- Inclui TODAS as colunas que o frontend precisa + colunas Escavador

DROP TABLE IF EXISTS processos CASCADE;

CREATE TABLE processos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Colunas do frontend (useProcessos.ts)
  number TEXT UNIQUE,
  client TEXT DEFAULT '',
  court TEXT DEFAULT '',
  class TEXT DEFAULT '',
  subject TEXT DEFAULT '',
  active_party TEXT DEFAULT '',
  passive_party TEXT DEFAULT '',
  responsible TEXT DEFAULT '',
  phase TEXT DEFAULT '',
  status TEXT DEFAULT 'Em andamento',
  next_deadline TIMESTAMP,
  last_movement TEXT DEFAULT '',
  value NUMERIC DEFAULT 0,
  docs_count INTEGER DEFAULT 0,
  owner_id UUID,

  -- Colunas do Escavador (monitoramento)
  numero_processo TEXT UNIQUE,
  tribunal TEXT DEFAULT '',
  ultima_movimentacao TEXT,
  ultima_movimentacao_data TIMESTAMP,
  last_checked_at TIMESTAMP DEFAULT NOW(),
  ativo BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Inserir os 3 processos com dados completos
INSERT INTO processos (number, numero_processo, client, court, tribunal, subject, status, ultima_movimentacao, ativo)
VALUES
(
  '1000484-17.2024.8.26.0338',
  '1000484-17.2024.8.26.0338',
  'MAICON KLEBER DE MORAES RODRIGUES',
  'TJSP',
  'SP',
  'ESBULHO / TURBACAO',
  'Em andamento',
  'Processual - Aguardando proxima etapa',
  true
),
(
  '0000312-21.2026.8.26.0048',
  '0000312-21.2026.8.26.0048',
  'ROSANA CRISTINA DE CAMARGO BARBOSA',
  'TJSP',
  'SP',
  'Execucao de alimentos - rito da prisao',
  'Em andamento',
  'Em andamento - Execucao de alimentos',
  true
),
(
  '0000313-06.2026.8.26.0048',
  '0000313-06.2026.8.26.0048',
  'ROSANA CRISTINA DE CAMARGO BARBOSA',
  'TJSP',
  'SP',
  'Execucao de alimentos - rito da penhora',
  'Em andamento',
  'Em andamento - Execucao de alimentos',
  true
);

-- Verificar
SELECT number, client, court, subject, status, ativo FROM processos;
