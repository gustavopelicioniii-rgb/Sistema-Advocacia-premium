-- ==========================================
-- FIX: Criar tabela user_permissions
-- ==========================================
-- Execute este SQL no Supabase Dashboard > SQL Editor
-- Para corrigir o erro "relation 'user_permissions' does not exist"

-- 1. Criar tabela user_permissions
CREATE TABLE IF NOT EXISTS public.user_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module TEXT NOT NULL,
  can_view BOOLEAN NOT NULL DEFAULT true,
  can_edit BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (user_id, module)
);

-- 2. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_user_permissions_user ON public.user_permissions(user_id);

-- 3. Habilitar RLS (Row Level Security)
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- 4. Remover policies antigas se existirem
DROP POLICY IF EXISTS "Users read own permissions" ON public.user_permissions;
DROP POLICY IF EXISTS "Admins manage all permissions" ON public.user_permissions;

-- 5. Criar policy para usuários lerem suas próprias permissões
CREATE POLICY "Users read own permissions" ON public.user_permissions
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- 6. Criar policy para admins gerenciarem todas as permissões
CREATE POLICY "Admins manage all permissions" ON public.user_permissions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- 7. Adicionar comentário na tabela
COMMENT ON TABLE public.user_permissions IS 'Permissões por módulo (ver/editar). Admin define na Equipe; usuários limitados só veem o que tiver can_view.';

-- 8. Verificar se a tabela foi criada com sucesso
SELECT
  tablename,
  schemaname,
  CASE
    WHEN rowsecurity THEN 'Enabled'
    ELSE 'Disabled'
  END as rls_status
FROM pg_tables
WHERE tablename = 'user_permissions' AND schemaname = 'public';

-- ==========================================
-- SUCESSO! Agora você pode usar o botão "Sincronizar contas"
-- ==========================================
