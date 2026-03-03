-- SETUP FINAL - Versão Ultra Simples
-- Copie e execute TUDO isto no Supabase SQL Editor

-- 1. DELETAR TABELA ANTIGA (se existir)
DROP TABLE IF EXISTS processos CASCADE;

-- 2. CRIAR TABELA NOVA (simples e direta)
CREATE TABLE processos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_processo TEXT UNIQUE NOT NULL,
  tribunal TEXT NOT NULL,
  ultima_movimentacao TEXT,
  ultima_movimentacao_data TIMESTAMP,
  last_checked_at TIMESTAMP DEFAULT NOW(),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Pronto! Tabela criada.
SELECT 'Tabela processos criada com sucesso!' as status;
