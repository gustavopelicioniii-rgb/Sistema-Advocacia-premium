-- =============================================
-- Segurança: correções de RLS e funções
-- Auditoria Sprint 2 — 2026-03-02
-- =============================================

-- ============================================================
-- 1. process_movements — Remove política FOR ALL USING(true)
--    que anulava todo o isolamento multi-tenant.
--    O service_role (cron) bypassa RLS automaticamente —
--    não precisa de política explícita.
-- ============================================================
DROP POLICY IF EXISTS "Service role can manage process_movements" ON public.process_movements;

-- INSERT: usuário insere apenas em processos seus
DROP POLICY IF EXISTS "Users can insert own process_movements" ON public.process_movements;
CREATE POLICY "Users can insert own process_movements"
  ON public.process_movements
  FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- UPDATE: usuário edita apenas os próprios
DROP POLICY IF EXISTS "Users can update own process_movements" ON public.process_movements;
CREATE POLICY "Users can update own process_movements"
  ON public.process_movements
  FOR UPDATE
  USING  (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- DELETE: usuário remove apenas os próprios
DROP POLICY IF EXISTS "Users can delete own process_movements" ON public.process_movements;
CREATE POLICY "Users can delete own process_movements"
  ON public.process_movements
  FOR DELETE
  USING (owner_id = auth.uid());

-- ============================================================
-- 2. process_monitor_logs — Remove WITH CHECK (true)
--    que permitia qualquer usuário inserir logs falsos.
--    O cron usa service_role e não precisa de política RLS.
-- ============================================================
DROP POLICY IF EXISTS "Service role can insert process_monitor_logs" ON public.process_monitor_logs;

-- ============================================================
-- 3. agenda_events — Remove "OR owner_id IS NULL"
--    que expunha eventos sem dono a todos os usuários.
-- ============================================================
DROP POLICY IF EXISTS "Users can manage own agenda events" ON public.agenda_events;
CREATE POLICY "Users can manage own agenda events"
  ON public.agenda_events
  FOR ALL
  USING  (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- ============================================================
-- 4. calculo_logs — Adiciona UPDATE e DELETE ausentes
-- ============================================================
DROP POLICY IF EXISTS "Users can update own calculo_logs" ON public.calculo_logs;
CREATE POLICY "Users can update own calculo_logs"
  ON public.calculo_logs
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.calculos c
      WHERE c.id = calculo_logs.calculo_id
        AND c.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete own calculo_logs" ON public.calculo_logs;
CREATE POLICY "Users can delete own calculo_logs"
  ON public.calculo_logs
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.calculos c
      WHERE c.id = calculo_logs.calculo_id
        AND c.owner_id = auth.uid()
    )
  );

-- ============================================================
-- 5. indices_oficiais — Permite admin gerenciar índices
--    (poplar tabela via UI/API sem acesso direto ao banco)
-- ============================================================
DROP POLICY IF EXISTS "Admin users can manage indices_oficiais" ON public.indices_oficiais;
CREATE POLICY "Admin users can manage indices_oficiais"
  ON public.indices_oficiais
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- ============================================================
-- 6. fn_check_process_plan_limit — Corrige SET search_path
--    de "public" para '' para evitar schema injection em
--    funções SECURITY DEFINER.
-- ============================================================
CREATE OR REPLACE FUNCTION public.fn_check_process_plan_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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

  IF NOT FOUND THEN
    v_plan := 'start';
  END IF;

  -- Busca o limite do plano na tabela subscription_plans
  SELECT sp.process_limit
  INTO   v_limit
  FROM   public.subscription_plans sp
  WHERE  sp.plan_name = v_plan;

  IF NOT FOUND THEN
    v_limit := 40;
  END IF;

  -- Conta processos atuais do owner
  SELECT COUNT(*)
  INTO   v_count
  FROM   public.processos
  WHERE  owner_id = NEW.owner_id;

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
  'Trigger BEFORE INSERT em processos: bloqueia ao atingir limite do plano. SECURITY DEFINER com search_path = '''' para evitar schema injection.';
