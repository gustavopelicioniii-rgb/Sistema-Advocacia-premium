# 📋 Integração Escavador — Documentação Técnica

**Última atualização:** 2026-03-02
**Status:** ✅ Implementado
**Versão:** 1.0

---

## 🎯 Visão Geral

Sistema completo de importação e monitoramento de processos jurídicos integrado com a **API Escavador**.

### Arquitetura

```
Frontend (React)
    ↓
Supabase Edge Function (importar-processos)
    ↓ (chama)
API Escavador
    ↓ (responde)
Edge Function salva no Banco de Dados
    ↓
Tabela: processos

┌─────────────────────────────────────────┐
│ Scheduler Supabase (1x/dia)             │
│ ↓                                       │
│ Edge Function (verificar-movimentacoes) │
│ ↓ (compara)                             │
│ Atualiza processos se mudou             │
│ ↓ (notifica)                            │
│ Advogado recebe notificação             │
└─────────────────────────────────────────┘
```

---

## 🔧 Setup Inicial

### 1. Variáveis de Ambiente

#### No Supabase Dashboard

1. Acesse **Project Settings** → **Edge Functions**
2. Clique em **Environment Variables**
3. Adicione:

```
ESCAVADOR_TOKEN = seu_token_aqui
```

4. Salve (Save)

#### No `.env.local` (Development)

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 2. Deploy das Edge Functions

```bash
# Criar pasta das functions
supabase functions create importar-processos
supabase functions create verificar-movimentacoes

# Deploy
supabase functions deploy importar-processos
supabase functions deploy verificar-movimentacoes
```

### 3. Executar Migration SQL

```bash
supabase db push
```

Isso cria a tabela `processos` com:

- Schema completo
- RLS policies
- Indexes de performance
- Triggers e views

### 4. Configurar Scheduler (no painel Supabase)

1. Vá para **Database** → **Webhooks**
2. Crie novo webhook:
    - **Type:** HTTP Request
    - **Events:** None (vamos usar scheduling)
    - **URL:** `https://your-project.supabase.co/functions/v1/verificar-movimentacoes`

> **Nota:** Supabase ainda não tem UI para Scheduler. Use a API ou aguarde release. Alternativa: use cron job externo.

---

## 📦 Edge Functions

### 1. `importar-processos`

**Endpoint:** `POST /functions/v1/importar-processos`

**Descrição:** Importa processos de um advogado da API Escavador

**Request Body:**

```json
{
    "oab_estado": "SP",
    "oab_numero": "123456",
    "user_id": "uuid-do-usuario" // opcional
}
```

**Response (Sucesso):**

```json
{
    "success": true,
    "message": "3 processo(s) importado(s) com sucesso",
    "processos_importados": 3
}
```

**Response (Erro):**

```json
{
    "error": "Mensagem de erro",
    "details": "Detalhes adicionais"
}
```

**Fluxo Interno:**

1. ✅ Valida `oab_estado` e `oab_numero`
2. ✅ Lê `ESCAVADOR_TOKEN` do env
3. ✅ Chama API Escavador
4. ✅ Salva/atualiza processos no banco (upsert)
5. ✅ Retorna quantidade importada

**Erros Tratados:**

- `400 Bad Request` - Campos obrigatórios faltando
- `401 Unauthorized` - Token inválido
- `500 Server Error` - Erro ao salvar no banco

---

### 2. `verificar-movimentacoes`

**Endpoint:** `POST /functions/v1/verificar-movimentacoes`

**Descrição:** Verifica atualizações em todos os processos ativos (roda via Scheduler)

**Request Body:** (vazio - rodará automático via scheduler)

**Response:**

```json
{
    "success": true,
    "message": "Verificação concluída: 2 atualização(ões)",
    "processos_verificados": 15,
    "atualizacoes": 2,
    "processos_atualizados": [
        {
            "numero_processo": "0001234-56.2025.8.26.0100",
            "nova_movimentacao": "Sentença..."
        }
    ],
    "erros": null
}
```

**Lógica:**

1. ✅ Busca todos os processos onde `ativo = true`
2. ✅ Para cada processo:
    - Verifica se `last_checked_at > 24h`
    - Se sim: chama API Escavador
    - Compara `ultima_movimentacao`
    - Se mudou: atualiza no banco + notifica
    - Atualiza `last_checked_at`
3. ✅ Retorna resumo das mudanças

**Executar Manualmente:**

```bash
curl -X POST 'https://your-project.supabase.co/functions/v1/verificar-movimentacoes' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

---

## 📊 Banco de Dados

### Tabela: `processos`

```sql
CREATE TABLE processos (
  id UUID PRIMARY KEY,
  numero_processo TEXT UNIQUE NOT NULL,
  tribunal TEXT NOT NULL,
  ultima_movimentacao TEXT,
  ultima_movimentacao_data TIMESTAMP,
  last_checked_at TIMESTAMP,
  ativo BOOLEAN DEFAULT true,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### Indexes (Performance)

```sql
idx_processos_user_id              -- Buscar processos por usuário
idx_processos_numero_processo      -- Buscar específico
idx_processos_ativo                -- Listar ativos
idx_processos_last_checked_at      -- Scheduler: próximos a verificar
```

### Views Úteis

```sql
-- Processos ativos (para exibir no dashboard)
SELECT * FROM processos_ativos;

-- Processos que precisam verificação (> 24h)
SELECT * FROM processos_para_verificar;
```

### RLS (Row Level Security)

| Política     | Quem           | O que                             |
| ------------ | -------------- | --------------------------------- |
| View         | Usuário        | Vê apenas seus processos          |
| Insert       | Usuário        | Insere apenas seus processos      |
| Update       | Usuário        | Atualiza apenas seus processos    |
| Service Role | Edge Functions | Podem fazer tudo (upsert, update) |

---

## 🎨 Frontend Integration

### Hook: `useEscavadorImport`

```typescript
import { useEscavadorImport } from '@/hooks/useEscavadorImport'

function MyComponent() {
  const { loading, error, success, processosImportados, importarProcessos } =
    useEscavadorImport()

  const handleImport = async () => {
    await importarProcessos({
      oab_estado: 'SP',
      oab_numero: '123456'
    })
  }

  return (
    <button onClick={handleImport} disabled={loading}>
      {loading ? 'Importando...' : 'Importar'}
    </button>
  )
}
```

### Hook: `useProcessosMonitoring`

```typescript
import { useProcessosMonitoring } from '@/hooks/useProcessosMonitoring'

function Dashboard() {
  const { processos, verificarAgora } = useProcessosMonitoring()

  return (
    <>
      <button onClick={verificarAgora}>Verificar Agora</button>
      <ProcessoList processos={processos} />
    </>
  )
}
```

### Componente: `ProcessoImporter`

```typescript
import { ProcessoImporter } from '@/components/ProcessoImporter'

export default function PaginaImportacao() {
  return <ProcessoImporter />
}
```

---

## 🔐 Segurança

### Token Escavador

⚠️ **CRÍTICO:** Nunca exponha o token no frontend!

```typescript
// ❌ ERRADO - Token visível no browser
const token = "eyJ0eXAi...";
await fetch("https://api.escavador.com/...", {
    headers: { Authorization: `Bearer ${token}` },
});

// ✅ CORRETO - Token no backend (Edge Function)
// Token fica em ESCAVADOR_TOKEN env var do Supabase
// Frontend chama Edge Function que usa o token internamente
```

### Criptografia de Dados

- ✅ Dados em trânsito: HTTPS
- ✅ Dados em repouso: Criptografia nativa Supabase
- ✅ RLS: Cada usuário vê só seus dados
- ✅ Sem logs sensíveis

### Rate Limiting

API Escavador pode ter limites. Considere implementar:

```typescript
// No lado da Edge Function
const MAX_REQUESTS_PER_MINUTE = 30;
const requestCache = new Map();

// Verificar antes de chamar API
if (requestCache.has(user_id) && Date.now() - requestCache.get(user_id) < 2000) {
    throw new Error("Muitas requisições. Aguarde...");
}
```

---

## 📈 Monitoramento

### Logs das Edge Functions

No painel Supabase:

1. **Functions** → Selecione a function
2. **Logs** → Veja requests/responses/erros

### Query SQL para Auditoria

```sql
-- Últimas importações
SELECT user_id, COUNT(*) as total, MAX(created_at) as ultima
FROM processos
GROUP BY user_id
ORDER BY ultima DESC;

-- Processos nunca verificados
SELECT numero_processo, created_at
FROM processos
WHERE last_checked_at = created_at;

-- Processos mais antigos sem update
SELECT numero_processo, last_checked_at, CURRENT_TIMESTAMP - last_checked_at as tempo
FROM processos
WHERE ativo = true
ORDER BY last_checked_at ASC
LIMIT 10;
```

---

## 🐛 Troubleshooting

### Problema: "ESCAVADOR_TOKEN não configurado"

**Solução:**

1. Vá para Supabase Dashboard
2. **Project Settings** → **Edge Functions** → **Environment Variables**
3. Adicione `ESCAVADOR_TOKEN` com o valor correto
4. Redeploy a function: `supabase functions deploy importar-processos`

### Problema: "Erro ao salvar no banco"

**Causas possíveis:**

- RLS policy bloqueando (verificar `user_id`)
- Constraints violadas (ex: `numero_processo` duplicado)
- Service Role Key não tem permissão

**Debug:**

```sql
-- Verificar dados inseridos
SELECT * FROM processos LIMIT 5;

-- Verificar se RLS está ativa
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'processos';
```

### Problema: Scheduler não rodando

**Causas:**

- Scheduler ainda não foi criado/ativado
- URL do webhook incorreta
- Edge Function retorna erro

**Solução:**
Executar manualmente enquanto o Scheduler oficial não funciona:

```bash
# Via cron job ou job scheduler externo
curl -X POST 'https://seu-projeto.supabase.co/functions/v1/verificar-movimentacoes'
```

---

## 🚀 Próximas Implementações

- [ ] Sistema de notificações (email/push)
- [ ] Dashboard com gráficos de movimentações
- [ ] Exportação de relatórios em PDF
- [ ] Integração com Google Calendar (agendar prazos)
- [ ] Análise IA de tendências processuais
- [ ] API pública para clientes do advogado acessarem seus processos

---

## 📚 Referências

- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Supabase Real-time Webhooks](https://supabase.com/docs/guides/database/webhooks/realtime)
- [API Escavador](https://api.escavador.com/)
- [Deno Documentation](https://deno.land/manual)

---

## 👥 Suporte

Para problemas ou dúvidas:

1. Verifique os logs no painel Supabase
2. Consulte a [API Escavador docs](https://api.escavador.com/)
3. Abra uma issue no GitHub

**Criado por:** Orion (aios-master)
**Data:** 2026-03-02
