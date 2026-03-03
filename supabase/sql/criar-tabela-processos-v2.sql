-- Criar tabela processos - VERSÃO SIMPLIFICADA
-- Execute NO SUPABASE SQL EDITOR

-- 1. Criar tabela (se não existir)
CREATE TABLE IF NOT EXISTS processos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_processo TEXT UNIQUE NOT NULL,
  tribunal TEXT NOT NULL,
  ultima_movimentacao TEXT,
  ultima_movimentacao_data TIMESTAMP,
  last_checked_at TIMESTAMP DEFAULT NOW(),
  ativo BOOLEAN DEFAULT true,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Tentar criar índices (ignora se já existem)
DROP INDEX IF EXISTS idx_processos_user_id;
CREATE INDEX idx_processos_user_id ON processos(user_id);

DROP INDEX IF EXISTS idx_processos_numero_processo;
CREATE INDEX idx_processos_numero_processo ON processos(numero_processo);

DROP INDEX IF EXISTS idx_processos_ativo;
CREATE INDEX idx_processos_ativo ON processos(ativo);

DROP INDEX IF EXISTS idx_processos_last_checked_at;
CREATE INDEX idx_processos_last_checked_at ON processos(last_checked_at);

-- 3. Habilitar RLS
ALTER TABLE processos ENABLE ROW LEVEL SECURITY;

-- 4. Criar RLS policies
-- Policy: Usuários veem apenas seus próprios processos
DROP POLICY IF EXISTS "Usuários veem seus próprios processos" ON processos;
CREATE POLICY "Usuários veem seus próprios processos"
  ON processos FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Policy: Service role (Edge Functions) pode fazer tudo
DROP POLICY IF EXISTS "Service role acesso completo" ON processos;
CREATE POLICY "Service role acesso completo"
  ON processos
  USING (true);

-- 5. Verificar estrutura
SELECT 'Tabela criada com sucesso!' as mensagem;
