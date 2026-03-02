-- =============================================
-- E-02: Plan Enforcement Server-Side
-- Trigger BEFORE INSERT em processos que bloqueia inserções
-- além do limite do plano do usuário.
--
-- A função get_plan_process_limit() já existe (migration 20250225200000).
-- Esta migration adiciona a tabela subscription_plans (fonte de verdade)
-- e o trigger de enforcement.
-- =============================================

-- 1) Tabela de planos — fonte de verdade centralizada (substitui hardcode no frontend)
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  plan_name   TEXT PRIMARY KEY,
  process_limit INT NOT NULL,
  fee_limit   INT,
  description TEXT
);

COMMENT ON TABLE public.subscription_plans IS 'Limites por plano de assinatura. Fonte de verdade para enforcement server-side.';

INSERT INTO public.subscription_plans (plan_name, process_limit, description) VALUES
  ('start', 40,  'Plano inicial — até 40 processos'),
  ('pro',   100, 'Plano profissional — até 100 processos'),
  ('elite', 250, 'Plano elite — até 250 processos')
ON CONFLICT (plan_name) DO UPDATE
  SET process_limit = EXCLUDED.process_limit,
      description   = EXCLUDED.description;

-- RLS: leitura pública para usuários autenticados (frontend pode ler limites)
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read subscription_plans"
  ON public.subscription_plans
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- 2) Função de enforcement — SECURITY DEFINER para ler profiles sem restrição de RLS
CREATE OR REPLACE FUNCTION public.fn_check_process_plan_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan        TEXT;
  v_limit       INT;
  v_count       INT;
BEGIN
  -- Busca o plano do usuário (padrão 'start' se NULL)
  SELECT COALESCE(p.subscription_plan, 'start')
  INTO   v_plan
  FROM   public.profiles p
  WHERE  p.id = NEW.owner_id;

  -- Se owner_id não encontrado em profiles, trata como 'start'
  IF NOT FOUND THEN
    v_plan := 'start';
  END IF;

  -- Busca o limite do plano na tabela subscription_plans
  SELECT sp.process_limit
  INTO   v_limit
  FROM   public.subscription_plans sp
  WHERE  sp.plan_name = v_plan;

  -- Fallback para o caso do plano não existir na tabela
  IF NOT FOUND THEN
    v_limit := 40;
  END IF;

  -- Conta processos atuais do owner (excluindo o que está sendo inserido)
  SELECT COUNT(*)
  INTO   v_count
  FROM   public.processos
  WHERE  owner_id = NEW.owner_id;

  -- Bloqueia se atingiu o limite
  IF v_count >= v_limit THEN
    RAISE EXCEPTION
      'Limite do plano "%" atingido (% de % processos). Atualize seu plano para cadastrar mais processos.',
      v_plan, v_count, v_limit
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.fn_check_process_plan_limit() IS
  'Trigger function: bloqueia INSERT em processos quando owner atingiu limite do plano. SECURITY DEFINER para ler profiles sem restrição de RLS.';

-- 3) Trigger BEFORE INSERT em processos
DROP TRIGGER IF EXISTS trg_check_process_plan_limit ON public.processos;

CREATE TRIGGER trg_check_process_plan_limit
  BEFORE INSERT ON public.processos
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_check_process_plan_limit();

COMMENT ON TRIGGER trg_check_process_plan_limit ON public.processos IS
  'Enforcement de limite de plano: impede INSERT além do limite mesmo via API direta ou Supabase Studio.';

-- 4) Atualizar get_plan_process_limit() existente para usar a tabela (remove hardcode)
CREATE OR REPLACE FUNCTION public.get_plan_process_limit(p_plan_name TEXT)
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    (SELECT process_limit FROM public.subscription_plans WHERE plan_name = p_plan_name),
    40  -- fallback seguro
  );
$$;

COMMENT ON FUNCTION public.get_plan_process_limit(TEXT) IS
  'Retorna o limite de processos para o plano informado. Lê de subscription_plans (não mais hardcoded).';
