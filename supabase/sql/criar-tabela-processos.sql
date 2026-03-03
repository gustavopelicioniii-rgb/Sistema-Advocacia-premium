-- Criar tabela processos com schema completo
-- Executar NO SUPABASE SQL EDITOR

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

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_processos_user_id ON processos(user_id);
CREATE INDEX IF NOT EXISTS idx_processos_numero_processo ON processos(numero_processo);
CREATE INDEX IF NOT EXISTS idx_processos_ativo ON processos(ativo);
CREATE INDEX IF NOT EXISTS idx_processos_last_checked_at ON processos(last_checked_at);

-- 3. Habilitar RLS
ALTER TABLE processos ENABLE ROW LEVEL SECURITY;

-- 4. Criar RLS policies (se não existirem)
-- Policy: Usuários veem apenas seus próprios processos
DROP POLICY IF EXISTS "Usuários veem seus próprios processos" ON processos;
CREATE POLICY "Usuários veem seus próprios processos"
  ON processos FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Policy: Usuários podem inserir seus próprios processos
DROP POLICY IF EXISTS "Usuários inserem seus próprios processos" ON processos;
CREATE POLICY "Usuários inserem seus próprios processos"
  ON processos FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Policy: Usuários podem atualizar seus próprios processos
DROP POLICY IF EXISTS "Usuários atualizam seus próprios processos" ON processos;
CREATE POLICY "Usuários atualizam seus próprios processos"
  ON processos FOR UPDATE
  USING (auth.uid() = user_id OR user_id IS NULL)
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- 5. Verificar se foi criada com sucesso
SELECT table_name FROM information_schema.tables
WHERE table_name = 'processos' AND table_schema = 'public';

-- 6. Mostrar estrutura da tabela
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'processos'
ORDER BY ordinal_position;
