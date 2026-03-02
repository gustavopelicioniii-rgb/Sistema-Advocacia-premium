-- =============================================================================
-- E-07: DB Governance — Índices compostos para padrões de query frequentes
-- =============================================================================
-- Objetivo: adicionar índices compostos nas tabelas core que faltam cobertura
-- para os padrões de acesso do frontend (order + filter por owner_id).
--
-- Convenção: todos os índices usam IF NOT EXISTS para ser idempotentes e
-- seguros de re-executar em ambientes distintos (local, preview, prod).
--
-- Padrão de query analisado por tabela:
--   processos   → ORDER BY created_at DESC   | filter by status, next_deadline
--   fees        → ORDER BY created_at DESC   | filter by status, due_date, paid_date
--   deadlines   → ORDER BY data_fim ASC      | filter by status (Pendente)
--   crm_clients → filter by stage_id         | owned by owner_id
--   crm_stages  → ORDER BY position ASC      | owned by owner_id
--   audiencias  → ORDER BY data              | já tem (process_id) e (owner_id)
--   office_expenses → ORDER BY due_date DESC | já tem (owner_id), (category), (due_date)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. processos — tabela principal, listada com ORDER BY created_at DESC
--    RLS filtra por owner_id implicitamente; índice composto cobre ambos.
-- -----------------------------------------------------------------------------

-- Lista principal: SELECT * FROM processos ORDER BY created_at DESC RANGE 0,499
CREATE INDEX IF NOT EXISTS idx_processos_owner_created
    ON public.processos(owner_id, created_at DESC);

-- Filtro de status (stats, dashboard, relatórios): WHERE status IN (...)
CREATE INDEX IF NOT EXISTS idx_processos_owner_status
    ON public.processos(owner_id, status);

-- Dashboard de prazos: WHERE next_deadline IS NOT NULL AND status != 'Concluído'
-- Índice parcial: só indexa linhas com prazo definido (reduz tamanho do índice)
CREATE INDEX IF NOT EXISTS idx_processos_next_deadline_active
    ON public.processos(owner_id, next_deadline)
    WHERE next_deadline IS NOT NULL;

COMMENT ON INDEX public.idx_processos_owner_created IS
    'E-07: lista principal de processos por dono ordenada por criação DESC.';
COMMENT ON INDEX public.idx_processos_owner_status IS
    'E-07: filtro de status dos processos por dono (stats, relatórios).';
COMMENT ON INDEX public.idx_processos_next_deadline_active IS
    'E-07: prazos ativos do dashboard — parcial (só linhas com next_deadline).';

-- -----------------------------------------------------------------------------
-- 2. fees — honorários, listados com ORDER BY created_at DESC
--    Relatórios filtram por status e paid_date; financeiro filtra por due_date.
-- -----------------------------------------------------------------------------

-- Lista principal: SELECT * FROM fees ORDER BY created_at DESC RANGE 0,499
CREATE INDEX IF NOT EXISTS idx_fees_owner_created
    ON public.fees(owner_id, created_at DESC);

-- Stats e relatórios: WHERE status = 'Pago' / 'Pendente' / 'Atrasado'
CREATE INDEX IF NOT EXISTS idx_fees_owner_status
    ON public.fees(owner_id, status);

-- Relatório de receita mensal: WHERE status = 'Pago' AND paid_date IS NOT NULL
CREATE INDEX IF NOT EXISTS idx_fees_owner_paid_date
    ON public.fees(owner_id, paid_date)
    WHERE paid_date IS NOT NULL;

-- Ordenação por vencimento na FeesTable
CREATE INDEX IF NOT EXISTS idx_fees_owner_due_date
    ON public.fees(owner_id, due_date DESC NULLS LAST);

COMMENT ON INDEX public.idx_fees_owner_created IS
    'E-07: lista principal de honorários por dono ordenada por criação DESC.';
COMMENT ON INDEX public.idx_fees_owner_status IS
    'E-07: filtro de status dos honorários (stats financeiros e relatórios).';
COMMENT ON INDEX public.idx_fees_owner_paid_date IS
    'E-07: relatório de receita mensal — parcial (só registros com paid_date).';
COMMENT ON INDEX public.idx_fees_owner_due_date IS
    'E-07: ordenação por vencimento na tabela de honorários.';

-- -----------------------------------------------------------------------------
-- 3. deadlines — prazos processuais
--    useDeadlines: ORDER BY data_fim ASC; CriticalDeadlines: WHERE status='Pendente'
-- -----------------------------------------------------------------------------

-- Query principal: SELECT * FROM deadlines ORDER BY data_fim ASC
CREATE INDEX IF NOT EXISTS idx_deadlines_owner_data_fim
    ON public.deadlines(owner_id, data_fim ASC);

-- Filtro do CriticalDeadlines: WHERE status = 'Pendente' AND data_fim IS NOT NULL
CREATE INDEX IF NOT EXISTS idx_deadlines_owner_status
    ON public.deadlines(owner_id, status);

COMMENT ON INDEX public.idx_deadlines_owner_data_fim IS
    'E-07: lista de prazos por dono ordenada por data_fim ASC (CriticalDeadlines).';
COMMENT ON INDEX public.idx_deadlines_owner_status IS
    'E-07: filtro de status nos prazos (Pendente para dashboard).';

-- -----------------------------------------------------------------------------
-- 4. crm_clients — kanban de leads
--    Pipeline filtra por stage_id; relatórios por owner_id
-- -----------------------------------------------------------------------------

-- Filter pipeline: WHERE stage_id = X (para contar leads por coluna)
CREATE INDEX IF NOT EXISTS idx_crm_clients_stage
    ON public.crm_clients(stage_id);

-- List por dono (RLS + relatórios)
CREATE INDEX IF NOT EXISTS idx_crm_clients_owner
    ON public.crm_clients(owner_id);

COMMENT ON INDEX public.idx_crm_clients_stage IS
    'E-07: filtro de leads por etapa do pipeline CRM.';
COMMENT ON INDEX public.idx_crm_clients_owner IS
    'E-07: listagem de leads por dono para relatórios.';

-- -----------------------------------------------------------------------------
-- 5. crm_stages — colunas do kanban
--    ORDER BY position ASC; filtrado por owner_id via RLS
-- -----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_crm_stages_owner_position
    ON public.crm_stages(owner_id, position ASC);

COMMENT ON INDEX public.idx_crm_stages_owner_position IS
    'E-07: colunas do kanban ordenadas por posição por dono.';

-- -----------------------------------------------------------------------------
-- 6. audiencias — audiências por processo
--    Já tem (process_id) e (owner_id); adiciona composto para calendário por data
-- -----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_audiencias_owner_data
    ON public.audiencias(owner_id, data);

COMMENT ON INDEX public.idx_audiencias_owner_data IS
    'E-07: calendário de audiências por dono ordenado por data.';

-- -----------------------------------------------------------------------------
-- 7. office_expenses — despesas do escritório
--    Já tem (owner_id), (category), (due_date); adiciona composto status e due_date
-- -----------------------------------------------------------------------------

-- Dashboard de despesas filtra por status (Pendente, Pago, Atrasado)
CREATE INDEX IF NOT EXISTS idx_office_expenses_owner_status
    ON public.office_expenses(owner_id, status);

-- Ordenação principal: ORDER BY due_date DESC NULLS LAST, created_at DESC
CREATE INDEX IF NOT EXISTS idx_office_expenses_owner_due_date_created
    ON public.office_expenses(owner_id, due_date DESC NULLS LAST, created_at DESC);

COMMENT ON INDEX public.idx_office_expenses_owner_status IS
    'E-07: filtro de status das despesas por dono.';
COMMENT ON INDEX public.idx_office_expenses_owner_due_date_created IS
    'E-07: ordenação principal das despesas (due_date DESC, created_at DESC).';
