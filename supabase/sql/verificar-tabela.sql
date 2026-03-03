-- Verificar estrutura da tabela processos

-- 1. Listar todas as tabelas
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- 2. Se a tabela processos existe, mostrar suas colunas
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'processos'
ORDER BY ordinal_position;
