# Scheduler Setup - Monitoramento de Processos (1x/dia)

Este documento detalha como configurar a verificacao automatica de movimentacoes
dos processos importados via Escavador. A Edge Function `verificar-movimentacoes`
deve ser chamada 1x por dia para manter os dados atualizados.

---

## Pre-Requisitos

- Edge Function `verificar-movimentacoes` deployada no Supabase
- Variavel `ESCAVADOR_TOKEN` configurada no Supabase Dashboard
- Projeto Supabase: `vakfmjdbmlzuoenqpquc`

---

## Opcao A: Cron Job Externo (Recomendado)

Qualquer servidor com `cron` pode ser usado. Basta executar um `curl` apontando
para a Edge Function.

### Configuracao

```bash
# Editar crontab
crontab -e

# Adicionar esta linha para executar 1x/dia as 09h00 (horario do servidor)
0 9 * * * curl -s -X POST 'https://vakfmjdbmlzuoenqpquc.supabase.co/functions/v1/verificar-movimentacoes' -H 'Content-Type: application/json' -d '{}' > /dev/null 2>&1
```

### Verificar se o cron esta ativo

```bash
crontab -l
```

### Health Check

```bash
# Testar manualmente se a Edge Function responde
curl -X POST 'https://vakfmjdbmlzuoenqpquc.supabase.co/functions/v1/verificar-movimentacoes' \
  -H 'Content-Type: application/json' \
  -d '{}'

# Resposta esperada:
# { "success": true, "atualizacoes": 0, "message": "Verificacao concluida" }
```

---

## Opcao B: Vercel Crons (se deployado na Vercel)

Se o frontend esta hospedado na Vercel, voce pode usar Vercel Crons para
agendar a chamada. Nao precisa de servidor externo.

### 1. Criar o endpoint de API

Crie o arquivo `api/cron/verificar-processos.ts`:

```typescript
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Protecao: apenas aceitar chamadas com o token secreto
    const authHeader = req.headers["authorization"];
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        const response = await fetch("https://vakfmjdbmlzuoenqpquc.supabase.co/functions/v1/verificar-movimentacoes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
        });

        const data = await response.json();
        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({
            error: "Falha ao verificar movimentacoes",
            details: error instanceof Error ? error.message : "Erro desconhecido",
        });
    }
}
```

### 2. Configurar no vercel.json

Adicione a secao `crons` ao `vercel.json` existente:

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

### 3. Configurar variavel de ambiente na Vercel

```
CRON_SECRET=<um-token-aleatorio-seguro>
```

Gere um token seguro:

```bash
openssl rand -hex 32
```

### Health Check

Acesse o painel Vercel em **Settings > Crons** para ver o historico de execucoes
e verificar se o cron esta rodando corretamente.

---

## Opcao C: GitHub Actions (Alternativa Gratuita)

Se nao tem servidor e nao usa Vercel, GitHub Actions pode executar o cron
gratuitamente (dentro dos limites do free tier: 2.000 min/mes).

### 1. Criar workflow

Crie o arquivo `.github/workflows/verificar-processos.yml`:

```yaml
name: Verificar Movimentacoes de Processos

on:
    schedule:
        # Executa 1x/dia as 09h00 UTC
        - cron: "0 9 * * *"
    workflow_dispatch:
        # Permite disparar manualmente pelo GitHub UI

jobs:
    verificar:
        runs-on: ubuntu-latest
        steps:
            - name: Chamar Edge Function
              run: |
                  response=$(curl -s -w "\n%{http_code}" -X POST \
                    'https://vakfmjdbmlzuoenqpquc.supabase.co/functions/v1/verificar-movimentacoes' \
                    -H 'Content-Type: application/json' \
                    -d '{}')

                  http_code=$(echo "$response" | tail -n1)
                  body=$(echo "$response" | sed '$d')

                  echo "HTTP Status: $http_code"
                  echo "Response: $body"

                  if [ "$http_code" != "200" ]; then
                    echo "ERRO: Edge Function retornou status $http_code"
                    exit 1
                  fi

            - name: Notificar sucesso
              if: success()
              run: echo "Verificacao de movimentacoes concluida com sucesso."

            - name: Notificar falha
              if: failure()
              run: echo "FALHA na verificacao de movimentacoes. Verifique os logs."
```

### 2. Ativar o workflow

Faca commit do arquivo acima e push para o branch `main`. O GitHub Actions
executara automaticamente no horario configurado.

### Health Check

Acesse **Actions** no repositorio GitHub para ver o historico de execucoes.
Voce tambem pode disparar manualmente clicando em **Run workflow**.

---

## Comparacao das Opcoes

| Criterio        | Cron Externo | Vercel Crons   | GitHub Actions        |
| --------------- | ------------ | -------------- | --------------------- |
| Custo           | Depende      | Gratis (Hobby) | Gratis (2000 min/mes) |
| Complexidade    | Baixa        | Media          | Baixa                 |
| Confiabilidade  | Alta         | Alta           | Media (pode atrasar)  |
| Monitoramento   | Manual       | Dashboard      | Dashboard             |
| Requer servidor | Sim          | Nao            | Nao                   |
| Disparo manual  | Via terminal | Via API        | Via GitHub UI         |

**Recomendacao:** Se usa Vercel, va com **Opcao B**. Caso contrario, **Opcao C**
(GitHub Actions) e a alternativa mais simples e gratuita.

---

## Verificacao de Saude (Health Check)

Independente da opcao escolhida, use este comando para verificar se o sistema
esta funcionando:

```bash
# Verificar se Edge Function responde
curl -s -X POST \
  'https://vakfmjdbmlzuoenqpquc.supabase.co/functions/v1/verificar-movimentacoes' \
  -H 'Content-Type: application/json' \
  -d '{}' | python3 -m json.tool

# Verificar logs da Edge Function no Supabase
supabase functions logs verificar-movimentacoes --project-ref vakfmjdbmlzuoenqpquc
```

---

**Criado:** 2026-03-02
**Atualizado:** 2026-03-02
