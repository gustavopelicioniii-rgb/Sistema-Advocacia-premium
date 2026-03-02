# ROADMAP — Enterprise Evolution

**smart-case-mate | SaaS Jurídico**
**Gerado por:** Orion (aios-master) | 2026-03-01

---

## Contexto Arquitetural

O sistema é uma **React SPA + Supabase BaaS**. Não existe Node.js/Express tradicional.
O "backend" é composto por:

- PostgreSQL (Supabase) com RLS para multi-tenancy
- Supabase Edge Functions (Deno) — já existem 3: calculadora, cron monitor, whatsapp
- Supabase Auth para autenticação
- Supabase Storage para arquivos

A evolução enterprise segue este modelo, **não uma reescrita para Node.js**.

---

## Modelo de Evolução

```
ATUAL (MVP Lovable)              TARGET (Enterprise)
──────────────────────           ──────────────────────────────────
Browser → Supabase DB            Browser → Edge Functions → Supabase DB
Token Escavador no browser       Token Escavador apenas em Edge Function
Plan limits no frontend          Plan limits via DB trigger / Edge Function
0% test coverage                 70% cobertura mínima
God files (800+ linhas)          Componentes < 200 linhas com responsabilidade única
TypeScript sem strict            TypeScript strict mode
SQL solto na raiz                Migrations 100% versionadas em supabase/migrations/
Sem audit logs                   Audit trail completo
Sem observabilidade              Logs estruturados + Sentry
Sem CI/CD                        GitHub Actions + quality gates
```

---

## Princípios da Evolução

1. **Sem big bang** — refatoração incremental, produção nunca quebra
2. **Security first** — críticos primeiro (E-01 token, E-02 plan enforcement)
3. **Tests before refactor** — cobertura mínima antes de mover código
4. **Edge Functions like microservices** — cada integração externa isolada
5. **RLS é a lei** — tenant isolation reforçada no banco, não só no frontend

---

## Epics e Prioridades

| Epic                                          | Título                                             | Prioridade | Sprint Sugerido |
| --------------------------------------------- | -------------------------------------------------- | ---------- | --------------- |
| [E-01](./epics/E-01-security-integrations.md) | Segurança: Integrações Externas via Edge Functions | 🔴 CRÍTICO | Sprint 1        |
| [E-02](./epics/E-02-plan-enforcement.md)      | Plan Enforcement Server-Side                       | 🔴 CRÍTICO | Sprint 1        |
| [E-03](./epics/E-03-typescript-quality.md)    | TypeScript Strict + Code Quality CI/CD             | 🔴 HIGH    | Sprint 2        |
| [E-04](./epics/E-04-god-files.md)             | Decomposição de God Files                          | 🟡 HIGH    | Sprint 2-3      |
| [E-05](./epics/E-05-test-coverage.md)         | Test Coverage 70% (Core Logic)                     | 🟡 HIGH    | Sprint 2-3      |
| [E-06](./epics/E-06-performance.md)           | Performance: Paginação e Queries                   | 🟡 HIGH    | Sprint 3        |
| [E-07](./epics/E-07-database-governance.md)   | Database Governance                                | 🟡 MEDIUM  | Sprint 3-4      |
| [E-08](./epics/E-08-observability.md)         | Observabilidade e Audit Logs                       | 🟡 MEDIUM  | Sprint 4        |
| [E-09](./epics/E-09-auth-hardening.md)        | Auth & Authorization Hardening                     | 🟡 MEDIUM  | Sprint 4        |

---

## Sequência de Sprints

```
SPRINT 1 (Segurança Crítica)
├── E-01: Edge Functions para Escavador + Google Calendar
└── E-02: Plan enforcement no banco (trigger + RLS)

SPRINT 2 (Qualidade de Código)
├── E-03: TypeScript strict + Husky + Prettier + CI
└── E-04: Decomposição ProcessoDetail.tsx (871 linhas)
└── E-05: Testes dos hooks críticos (plan limit, auth, processos)

SPRINT 3 (Performance + Dados)
├── E-04: Decomposição Configuracoes.tsx + Financeiro.tsx
├── E-05: Testes de RLS (tenant isolation)
└── E-06: Paginação + virtualização + indexes DB

SPRINT 4 (Enterprise Grade)
├── E-07: Database governance (migrations consolidadas, audit fields)
├── E-08: Observabilidade (logs estruturados, Sentry, health checks)
└── E-09: Auth hardening (role sync realtime, RBAC granular)
```

---

## Definition of Done — Enterprise

- [ ] TypeScript strict mode sem erros
- [ ] Cobertura de testes >= 70% na lógica core
- [ ] Nenhum secret exposto no bundle frontend
- [ ] Todos os limites de plano enforçados no servidor
- [ ] RLS testada e validada (sem cross-tenant leakage)
- [ ] Migrations todas em `supabase/migrations/` (nenhum SQL solto na raiz)
- [ ] Husky + ESLint + Prettier passando em todo commit
- [ ] God files decompostos (nenhum arquivo > 300 linhas de JSX)
- [ ] Logs estruturados em Edge Functions
- [ ] Sentry configurado para erros de produção
