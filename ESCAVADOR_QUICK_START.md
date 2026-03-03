# ⚡ Escavador Integration — Quick Start

Implementação rápida da integração com API Escavador. Todos os arquivos já foram criados!

---

## 📋 O que foi criado

✅ **Edge Functions (Backend)**

- `supabase/functions/importar-processos/index.ts` — Importa processos
- `supabase/functions/verificar-movimentacoes/index.ts` — Monitora atualizações

✅ **Database (Supabase)**

- `supabase/migrations/20260302_create_processos_table.sql` — Schema completo com RLS

✅ **Frontend (React)**

- `src/hooks/useEscavadorImport.ts` — Hook para importação
- `src/hooks/useProcessosMonitoring.ts` — Hook para monitoramento
- `src/components/ProcessoImporter.tsx` — Componente pronto para usar

✅ **Documentação**

- `docs/ESCAVADOR_INTEGRATION.md` — Guia técnico completo
- `docs/stories/1.1.story.md` — Story de desenvolvimento
- `.env.example` — Template de variáveis de ambiente

---

## 🚀 Próximos Passos

### 1️⃣ Configurar no Supabase Dashboard

```
Project Settings
  → Edge Functions
    → Environment Variables
      → Adicione: ESCAVADOR_TOKEN = seu_token_aqui
```

**Seu token:**

```
eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiN2I0OGVhNmYzNzBkYjQ3N2NjZmYxZWFhMzJkNzE1ZTdjNzY2MmMzOGUwOWM2ODc5MDBiYWE3N2NmOTU3MmEyMjczNWRhMmMyMmFhZWI5OGUiLCJpYXQiOjE3NzI0ODE4MTMuNzY2ODcxLCJuYmYiOjE3NzI0ODE4MTMuNzY2ODcyLCJleHAiOjIwODgxMDEwMTMuNzYzODQ0LCJzdWIiOiIzMjMwMjkxIiwic2NvcGVzIjpbImFjZXNzYXJfYXBpX3BhZ2EiLCJhY2Vzc2FyX2FwaV9wbGF5Z3JvdW5kIl19.iJViM6Am31icPNtA_GR_iQeU-Kks3Mm9Hn6rjpFo3tVNclwUILpqXQ79wmF2ztrm6pTHPRSHtWqrPB2VOa1TEj2UavIuAMsXY23zMYoKaOcELCXd-jSkIInoK0rehwFP6HFbK8pRg97NW1ASwhy-Giy0FYCNgdejvQJONOfX9tHeLKhnX1XSVCEny5HvfZw2XZs4bR8QwFuuZkTGJ4FXGA5VI6D9hiQNijrLv0ASz_cBzpBRj8quE1sdI5JIoJtObRoOiqD07Qe-5zQo3y9wkEL6F3VLjQwb7MZGNL_21xrGakfOFybw9ZhUzrYgIPw2PJ5iAR6JN7lX7GBpghO00SzTLJ9lllLbo58dq7O1LN72NiRSOahPY5jJIu4IKWO7qI9IXQuaFGZN5xzTkIryKZWDo791s6y4uuCIiCi2SxtICLoUSwrcNR-aLVwif6J5vD8Q7eh_UfTcrN54n-t0dNCzgupl5jELlqiAuFIKTkCa6QmXC-JQguCKKEarOA3lrLv0Y2y4L2btbXdeB6yOGI9PD9E3IT_rQOjlmYcqeqO2PGVrPJfXLkEQgBg5PiKjjVZ9cv_OPhMfcN1SUij590rSBJz-8ViiMzUgSC1wdqztjNr2XpVrLKDcxyBpkIVWVEDvfGBy---u1scUefDUnBl7sMoGiWmHnOtVqug33_0
```

⚠️ **IMPORTANTE:** Após terminar os testes, regenere este token no painel do Escavador!

---

### 2️⃣ Deploy das Edge Functions

```bash
# No terminal, na raiz do projeto

# Deploy da primeira Edge Function
supabase functions deploy importar-processos

# Deploy da segunda Edge Function
supabase functions deploy verificar-movimentacoes

# Verificar se foram deployadas
supabase functions list
```

---

### 3️⃣ Executar Migration do Banco

```bash
# Aplica a migration que cria a tabela processos
supabase db push

# Verificar se foi criada
supabase db list
```

---

### 4️⃣ Configurar Variáveis de Ambiente Locais

```bash
# Copiar template
cp .env.example .env.local

# Editar e adicionar suas chaves Supabase
nano .env.local
```

Adicione:

```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key
```

---

### 5️⃣ Usar o Componente no Frontend

```typescript
// Em qualquer página/componente
import { ProcessoImporter } from '@/components/ProcessoImporter'

export default function MinhaPage() {
  return (
    <div>
      <h1>Importar Meus Processos</h1>
      <ProcessoImporter />
    </div>
  )
}
```

---

### 6️⃣ Testar Manualmente

#### Teste 1: Chamar Edge Function via cURL

```bash
curl -X POST 'https://seu-projeto.supabase.co/functions/v1/importar-processos' \
  -H 'Content-Type: application/json' \
  -d '{
    "oab_estado": "SP",
    "oab_numero": "123456"
  }'
```

**Response esperada:**

```json
{
    "success": true,
    "message": "3 processo(s) importado(s) com sucesso",
    "processos_importados": 3
}
```

#### Teste 2: Verificar Dados no Banco

```sql
-- No Supabase SQL Editor
SELECT * FROM processos LIMIT 5;
```

#### Teste 3: Disparar Verificação Manual

```bash
curl -X POST 'https://seu-projeto.supabase.co/functions/v1/verificar-movimentacoes' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

---

### 7️⃣ Configurar Scheduler (Monitoramento Automático)

⚠️ **Nota:** Supabase não tem UI para Scheduler ainda. Use uma das opções:

#### Opção A: Usar Cron Job Externo (Recomendado)

```bash
# No seu servidor/máquina com cron:
# Executar 1x por dia às 09h00
0 9 * * * curl -s 'https://seu-projeto.supabase.co/functions/v1/verificar-movimentacoes' > /dev/null 2>&1
```

#### Opção B: Usar Vercel Crons (se deployado lá)

```typescript
// api/cron/verificar-processos.ts
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
    // Verificar token secreto
    if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response("Unauthorized", { status: 401 });
    }

    const response = await fetch("https://seu-projeto.supabase.co/functions/v1/verificar-movimentacoes", {
        method: "POST",
    });

    return response;
}
```

Depois configure no `vercel.json`:

```json
{
    "crons": [
        {
            "path": "/api/cron/verificar-processos",
            "schedule": "0 9 * * *"
        }
    ]
}
```

---

## 🧪 Checklist de Implementação

- [ ] Token Escavador configurado no Supabase Dashboard
- [ ] Edge Functions deployadas: `supabase functions deploy`
- [ ] Migration executada: `supabase db push`
- [ ] `.env.local` criado com Supabase URL e keys
- [ ] ComponentProcessoImporter` testado no frontend
- [ ] Teste de importação funcionando (cURL ou UI)
- [ ] Dados aparecem na tabela `processos`
- [ ] Scheduler/cron configurado
- [ ] Token Escavador regenerado (segurança)

---

## 🔐 Segurança — Checklist Final

- [ ] Token Escavador só existe em `ESCAVADOR_TOKEN` env var do Supabase
- [ ] `.env.local` está em `.gitignore` (não foi commitado)
- [ ] RLS policies ativas na tabela `processos`
- [ ] Sem logs do token em nenhum lugar
- [ ] Frontend NÃO tenta chamar API Escavador diretamente
- [ ] Todas as calls passam pela Edge Function

---

## 📊 Fluxo Completo

```
Usuário no App
  ↓ (clica "Importar")
ProcessoImporter Component
  ↓ (chama)
useEscavadorImport hook
  ↓ (POST)
supabase/functions/importar-processos
  ├─ Lê ESCAVADOR_TOKEN
  ├─ Chama API Escavador
  └─ Salva no banco (supabase/processos)
      ↓
      Tabela: processos

Daily (via cron/scheduler)
  ↓
supabase/functions/verificar-movimentacoes
  ├─ Busca processos ativos
  ├─ Checa cada um na API Escavador
  └─ Atualiza banco se mudou
      ↓
      Notifica advogado
```

---

## 💡 Próximas Features

- [ ] Notificações por email quando há mudança
- [ ] Dashboard com timeline de movimentações
- [ ] Exportar relatório em PDF
- [ ] Integração com Google Calendar (prazos)
- [ ] IA analisando tendências dos processos

---

## 🆘 Precisa de Ajuda?

1. **Erro no deploy:** Verifique `supabase functions logs importar-processos`
2. **Erro no banco:** Veja a migration: `supabase migrations list`
3. **Token inválido:** Regenere no painel Escavador
4. **Documentação completa:** Veja `docs/ESCAVADOR_INTEGRATION.md`

---

**Criado por:** Orion (aios-master)
**Data:** 2026-03-02
**Modelo utilizado:** Opus 4.6 (Recomendado para produção)

🎉 **Implementação concluída com sucesso!**
