# EPIC E-05 — Test Coverage 70% (Core Logic)

**Prioridade:** 🟡 HIGH | **Sprint:** 2-3

## Problema

O projeto tem **0% de cobertura real**. Existe apenas `src/test/example.test.ts` com `expect(true).toBe(true)`. Qualquer refatoração futura (E-04, E-06, etc.) é arriscada sem testes de regressão.

## Objetivo

Atingir 70% de cobertura na lógica core do sistema com testes unitários e de integração. Priorizar a lógica mais crítica: plan limits, autenticação, RLS, parsing, cálculos.

## Estratégia

### Pirâmide de Testes

```
         /\
        /  \  E2E (Playwright — futuro)
       /----\
      /      \  Integration (Supabase local)
     /--------\
    /          \  Unit (Vitest) ← FOCO AGORA
   /____________\
```

### O que Testar (Prioridade)

| Módulo                                    | Tipo        | Prioridade | Motivo                         |
| ----------------------------------------- | ----------- | ---------- | ------------------------------ |
| `processMonitor.ts`                       | Unit        | 🔴 P1      | Lógica de keywords e cooldown  |
| `csvParser.ts`                            | Unit        | 🔴 P1      | Edge cases de importação       |
| `escavador.ts` — `normalizeProcessNumber` | Unit        | 🔴 P1      | Transformação de dados crítica |
| `scoreCalculations.ts` (após E-04)        | Unit        | 🔴 P1      | Health score do dashboard      |
| `useProcessPlanLimit`                     | Integration | 🔴 P1      | Lógica de negócio crítica      |
| RLS: processos cross-tenant               | Integration | 🔴 P1      | Segurança multi-tenant         |
| RLS: fees isolamento                      | Integration | 🔴 P1      | Dados financeiros              |
| `AuthContext` role loading                | Unit        | 🟡 P2      | Auth behavior                  |
| `useProfile` plan limits                  | Unit        | 🟡 P2      | Planos                         |
| `useCreateProcesso` erro trigger          | Integration | 🟡 P2      | E-02 enforcement               |

## Ferramentas

- **Vitest** — já instalado, para unit tests
- **@testing-library/react** — já instalado, para component hooks
- **Supabase local** (`supabase start`) — para integration tests de RLS
- **MSW (Mock Service Worker)** — para mockar chamadas Edge Function nos unit tests

## Acceptance Criteria

- [ ] Cobertura >= 70% nos arquivos em `src/lib/` e `src/hooks/` críticos
- [ ] `npm test` passa sem erros
- [ ] `npm run test:coverage` gera relatório com mínimo 70%
- [ ] Testes de RLS: inserção cross-tenant falha (owner_id diferente)
- [ ] Testes de plan limit: 41º processo bloqueia no banco (E-02)
- [ ] GitHub Actions roda testes na PR (E-03)
- [ ] MSW configurado para mockar APIs externas

## Stories

### Unit Tests — lib/

- [ ] [5.1] Testes `processMonitor.ts`: `shouldCheckProcess`, `isRelevantMovement`, `detectMovementType`
- [ ] [5.2] Testes `csvParser.ts`: headers válidos, encoding, campos faltando, linhas vazias
- [ ] [5.3] Testes `escavador.ts`: `normalizeProcessNumber` com todos os formatos CNJ
- [ ] [5.4] Testes `scoreCalculations.ts`: health score com todos os cenários de borda

### Unit Tests — hooks/

- [ ] [5.5] Testes `useProcessPlanLimit`: start/pro/elite limits
- [ ] [5.6] Testes `getPlanProcessLimit`: todos os planos e null
- [ ] [5.7] Testes `AuthContext`: role loading, stale handling, signOut

### Integration Tests — RLS

- [ ] [5.8] Setup: `supabase start` + seed data para testes
- [ ] [5.9] Teste RLS `processos`: user A não vê processos do user B
- [ ] [5.10] Teste RLS `fees`: user A não acessa fees do user B
- [ ] [5.11] Teste RLS `documents`: isolamento por owner via process_id

### Integration Tests — Plan Enforcement (após E-02)

- [ ] [5.12] Teste trigger: inserção do 41º processo por usuário `start` falha
- [ ] [5.13] Teste trigger: usuário `pro` pode ter até 100, bloqueia no 101º

## Estrutura de Arquivos

```
src/test/
├── setup.ts                    # Já existe — expandir com MSW setup
├── lib/
│   ├── processMonitor.test.ts  # NOVO
│   ├── csvParser.test.ts       # NOVO
│   ├── escavador.test.ts       # NOVO
│   └── scoreCalculations.test.ts # NOVO (após E-04)
├── hooks/
│   ├── useProcessPlanLimit.test.ts # NOVO
│   └── useProfile.test.ts      # NOVO
└── integration/
    ├── rls.test.ts             # NOVO
    └── planEnforcement.test.ts # NOVO (após E-02)
```

## Riscos

- Testes de RLS requerem Supabase local rodando (`supabase start`)
- CI/CD (E-03) precisa inicializar banco de dados local ou usar seed
