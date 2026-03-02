-- =============================================================================
-- E-09: Field-Level Privacy — View pública de perfis sem campos sensíveis
-- =============================================================================
-- Problema: admin pode ler SELECT * FROM profiles e ver CPF, CEP, endereço.
-- Solução: view `profiles_public` expõe apenas campos não-sensíveis.
--
-- Campos EXCLUÍDOS da view (sensíveis):
--   cpf, endereco, numero, cep, bairro, complemento
--
-- Campos INCLUÍDOS (não-sensíveis):
--   id, full_name, email, role, phone, oab_number, profissao,
--   oab_state, estado, cidade, firm_logo_url, subscription_plan, updated_at
--
-- security_invoker = true: a view respeita o RLS da tabela profiles subjacente.
-- Admins veem todos os perfis (via is_admin()), mas apenas os campos listados.
-- Usuários comuns veem apenas o próprio perfil.
-- =============================================================================

CREATE OR REPLACE VIEW public.profiles_public
    WITH (security_invoker = true)
AS
SELECT
    id,
    full_name,
    email,
    role,
    phone,
    oab_number,
    profissao,
    oab_state,
    estado,
    cidade,
    firm_logo_url,
    subscription_plan,
    updated_at
FROM public.profiles;

COMMENT ON VIEW public.profiles_public IS
    'E-09: View pública de perfis — exclui campos sensíveis (CPF, CEP, endereço). '
    'Respeita o RLS da tabela profiles (security_invoker = true).';

-- Grant de leitura para usuários autenticados (respeitando RLS subjacente)
GRANT SELECT ON public.profiles_public TO authenticated;
