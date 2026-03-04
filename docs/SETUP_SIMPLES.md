# 🗄️ Setup Banco — VERSÃO SIMPLES

Se você recebeu erro nos índices, use esta versão simplificada.

---

## ✅ Passo 1: Copiar e Colar este SQL

Abra o **Supabase SQL Editor** e copie TUDO isto:

```sql
-- Criar tabela processos
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

-- Criar índices
DROP INDEX IF EXISTS idx_processos_user_id;
CREATE INDEX idx_processos_user_id ON processos(user_id);

DROP INDEX IF EXISTS idx_processos_numero_processo;
CREATE INDEX idx_processos_numero_processo ON processos(numero_processo);

DROP INDEX IF EXISTS idx_processos_ativo;
CREATE INDEX idx_processos_ativo ON processos(ativo);

DROP INDEX IF EXISTS idx_processos_last_checked_at;
CREATE INDEX idx_processos_last_checked_at ON processos(last_checked_at);

-- Habilitar RLS
ALTER TABLE processos ENABLE ROW LEVEL SECURITY;

-- Criar policy para usuários (opcional - para agora pode ignorar)
DROP POLICY IF EXISTS "Service role acesso completo" ON processos;
CREATE POLICY "Service role acesso completo" ON processos USING (true);
```

---

## ✅ Passo 2: Executar

1. Cole TUDO no **Supabase SQL Editor**
2. Clique **Run**

Se aparecer `Tabela criada com sucesso!` → ✅ Funcionou!

---

## ✅ Passo 3: Inserir os 3 Processos

Agora execute este SQL em uma NOVA query:

```sql
INSERT INTO processos (numero_processo, tribunal, ultima_movimentacao, ultima_movimentacao_data, last_checked_at, ativo)
VALUES
(
  '1000484-17.2024.8.26.0338',
  'SP',
  'Processual - Aguardando próxima etapa',
  NOW(),
  NOW(),
  true
),
(
  '0000312-21.2026.8.26.0048',
  'SP',
  'Em andamento - Execução de alimentos',
  NOW(),
  NOW(),
  true
),
(
  '0000313-06.2026.8.26.0048',
  'SP',
  'Em andamento - Execução de alimentos',
  NOW(),
  NOW(),
  true
);

-- Verificar inserção
SELECT numero_processo, tribunal, ativo, created_at FROM processos;
```

---

## ✅ Resultado Esperado

Você deve ver:

```
INSERT 0 3

 numero_processo       | tribunal | ativo | created_at
-----------------------+----------+-------+------------------
 1000484-17.2024.8...  | SP       | true  | 2026-03-02 ...
 0000312-21.2026.8...  | SP       | true  | 2026-03-02 ...
 0000313-06.2026.8...  | SP       | true  | 2026-03-02 ...
```

---

## 🎯 Pronto!

Agora você tem:

- ✅ Tabela `processos` criada
- ✅ Índices para performance
- ✅ 3 processos inseridos
- ✅ RLS configurado

Próximo: `docs/TESTAR_MONITORAMENTO.md` 🚀
