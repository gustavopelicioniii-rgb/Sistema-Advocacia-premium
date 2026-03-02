# EPIC E-04 — Decomposição de God Files

**Prioridade:** 🟡 HIGH | **Sprint:** 2-3

## Problema

Três pages concentram lógica de negócio, estado local e UI em arquivos gigantes:

| Arquivo                    | Linhas | Problema Principal                                                |
| -------------------------- | ------ | ----------------------------------------------------------------- |
| `pages/ProcessoDetail.tsx` | 871    | UI + lógica de processo + modais + tabs + documentos              |
| `pages/Configuracoes.tsx`  | 831    | 4 abas distintas (Perfil, Assinatura, Senha, Cartões) numa página |
| `pages/Financeiro.tsx`     | 662    | Honorários + Despesas + relatórios financeiros                    |
| `pages/CRM.tsx`            | 401    | Kanban + modais + lógica de drag-and-drop                         |
| `pages/Documentos.tsx`     | 441    | Upload + editor + listagem + filtros                              |

Isso inviabiliza:

- Trabalho paralelo em equipe (merge conflicts constantes)
- Testes unitários (lógica acoplada à UI)
- Manutenção (encontrar onde está algo leva minutos)

## Objetivo

Decompor cada god file em componentes menores com responsabilidade única (máx. 200 linhas de JSX por componente), extraindo lógica de negócio para hooks ou `src/lib/`.

## Regra de Ouro

> Um componente = uma responsabilidade. Se precisa rolar mais de uma tela para ler, está grande demais.

## Escopo por Arquivo

### ProcessoDetail.tsx (871 linhas) — Prioridade 1

Decomposição planejada:

```
pages/ProcessoDetail.tsx (~100l, container + routing de tabs)
├── components/processo/
│   ├── ProcessoHeader.tsx         # Cabeçalho + status + ações
│   ├── ProcessoInfoTab.tsx        # Aba de informações gerais
│   ├── ProcessoDocumentosTab.tsx  # Aba de documentos
│   ├── ProcessoPrazosTab.tsx      # Aba de prazos
│   ├── ProcessoMovimentacoesTab.tsx # Aba movimentações Escavador
│   └── ProcessoNotasTab.tsx       # Aba de notas
```

### Configuracoes.tsx (831 linhas) — Prioridade 2

```
pages/Configuracoes.tsx (~80l, container + tabs routing)
├── components/configuracoes/
│   ├── ConfigInformacoesTab.tsx   # Dados pessoais e do escritório
│   ├── ConfigAssinaturaTab.tsx    # Plano atual e upgrade
│   ├── ConfigSenhaTab.tsx         # Troca de senha
│   └── ConfigCartoesTab.tsx       # Métodos de pagamento
```

### Financeiro.tsx (662 linhas) — Prioridade 3

```
pages/Financeiro.tsx (~80l, container + tabs)
├── components/financeiro/
│   ├── HonorariosTab.tsx          # Lista e CRUD de honorários
│   ├── DespesasTab.tsx            # Lista e CRUD de despesas do processo
│   ├── RelatorioFinanceiroTab.tsx # Relatório e charts
│   └── FinanceiroStats.tsx        # Cards de resumo (já existem parcialmente)
```

### Dashboard.tsx — Extração de lógica

```
src/lib/scoreCalculations.ts  # Extrair cálculo do health score
```

## Acceptance Criteria

- [ ] Nenhum arquivo em `src/pages/` tem mais de 300 linhas
- [ ] Nenhum arquivo em `src/components/` (exceto ui/) tem mais de 200 linhas
- [ ] Comportamento visual e funcional idêntico ao atual (sem regressões)
- [ ] Lógica de cálculo do health score extraída para `src/lib/scoreCalculations.ts`
- [ ] Testes básicos de renderização para cada componente extraído

## Stories

### ProcessoDetail

- [ ] [4.1] Criar `ProcessoHeader.tsx` — extrair cabeçalho e ações do processo
- [ ] [4.2] Criar `ProcessoInfoTab.tsx` — extrair aba de informações
- [ ] [4.3] Criar `ProcessoDocumentosTab.tsx` — extrair aba documentos
- [ ] [4.4] Criar `ProcessoPrazosTab.tsx` — extrair aba de prazos
- [ ] [4.5] Criar `ProcessoMovimentacoesTab.tsx` — extrair aba movimentações
- [ ] [4.6] Refatorar `ProcessoDetail.tsx` para container com <200 linhas

### Configuracoes

- [ ] [4.7] Criar `ConfigInformacoesTab.tsx` — dados pessoais/escritório
- [ ] [4.8] Criar `ConfigAssinaturaTab.tsx` — plano e billing
- [ ] [4.9] Criar `ConfigSenhaTab.tsx` — troca de senha
- [ ] [4.10] Refatorar `Configuracoes.tsx` para container

### Financeiro

- [ ] [4.11] Criar `HonorariosTab.tsx` — honorários CRUD
- [ ] [4.12] Criar `DespesasTab.tsx` — despesas CRUD
- [ ] [4.13] Refatorar `Financeiro.tsx` para container

### Extras

- [ ] [4.14] Extrair `scoreCalculations.ts` do Dashboard
- [ ] [4.15] Decomposição CRM.tsx (Kanban + modal)

## Estratégia de Refatoração (Incremental)

1. Copiar componente para novo arquivo
2. Verificar imports e ajustar
3. Substituir no arquivo original
4. Verificar visualmente no browser
5. Reduzir arquivo original
6. Repeat para próxima seção

## Riscos

- Prop drilling pode aumentar — avaliar uso de context ou query cache
- Não alterar lógica durante a extração (apenas mover código)
