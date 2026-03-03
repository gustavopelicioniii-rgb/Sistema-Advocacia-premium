# 🧪 Testar Monitoramento de Processos

Siga os passos abaixo para validar que o sistema está funcionando corretamente.

---

## ✅ Passo 1: Verificar se os Processos foram Inseridos

No **Supabase SQL Editor**, execute:

```sql
SELECT numero_processo, tribunal, ultima_movimentacao, last_checked_at, ativo
FROM processos
ORDER BY created_at DESC
LIMIT 3;
```

**Resultado esperado:** 3 linhas com seus processos:
- `1000484-17.2024.8.26.0338`
- `0000312-21.2026.8.26.0048`
- `0000313-06.2026.8.26.0048`

---

## ✅ Passo 2: Disparar Verificação Manual

Execute a Edge Function de monitoramento:

```bash
curl -X POST 'https://seu-projeto.supabase.co/functions/v1/verificar-movimentacoes' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer seu-token-aqui' \
  -d '{}'
```

**Substitua:**
- `seu-projeto` → nome do seu projeto Supabase
- `seu-token-aqui` → seu `VITE_SUPABASE_ANON_KEY` do `.env.local`

**Resultado esperado:**

```json
{
  "success": true,
  "message": "Verificação concluída: X atualização(ões)",
  "processos_verificados": 3,
  "atualizacoes": 0,
  "processos_atualizados": []
}
```

---

## ✅ Passo 3: Verificar Logs da Edge Function

No **Supabase Dashboard**:

1. Vá em **Functions** (menu esquerdo)
2. Clique em **verificar-movimentacoes**
3. Vá em **Logs** e veja a execução

**Você deve ver:**

```
Processando processo 1000484-17.2024.8.26.0338...
Chamando API Escavador: /api/v2/processos/numero_cnj/1000484-17.2024.8.26.0338/movimentacoes
Resposta recebida com X movimentações
✓ Processo 1000484-17.2024.8.26.0338 atualizado com sucesso
```

---

## ✅ Passo 4: Verificar se os Dados foram Atualizados

Execute novamente no **SQL Editor**:

```sql
SELECT
  numero_processo,
  ultima_movimentacao,
  ultima_movimentacao_data,
  last_checked_at
FROM processos
WHERE numero_processo = '1000484-17.2024.8.26.0338';
```

**Você deve ver:**
- `ultima_movimentacao` com dados reais da API
- `ultima_movimentacao_data` com a data
- `last_checked_at` atualizado para AGORA

---

## 🔄 Passo 5: Configurar Monitoramento Automático

Para que a Edge Function execute **1x/dia automaticamente**, escolha uma opção:

### Opção A: Usando cron job (Linux/Mac)

```bash
# Editar crontab
crontab -e

# Adicionar linha (executa 09h00 toda manhã)
0 9 * * * curl -s 'https://seu-projeto.supabase.co/functions/v1/verificar-movimentacoes' > /dev/null 2>&1
```

### Opção B: Usando Vercel Crons (se está deployado no Vercel)

Já documentado em `docs/ESCAVADOR_INTEGRATION.md` → Seção "Configurar Scheduler"

### Opção C: Usando GitHub Actions

Arquivo pronto: `.github/workflows/check-processos.yml`

```yaml
name: Verificar Processos Diariamente

on:
  schedule:
    - cron: '0 9 * * *'  # 09h00 UTC todos os dias

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - name: Chamar Edge Function
        run: |
          curl -X POST 'https://seu-projeto.supabase.co/functions/v1/verificar-movimentacoes' \
            -H 'Content-Type: application/json' \
            -d '{}'
```

---

## ⚠️ Troubleshooting

### Erro: "ESCAVADOR_TOKEN não configurado"
→ Verifique **Project Settings → Edge Functions → Environment Variables**

### Erro: "Nenhuma movimentação encontrada"
→ Pode ser que a API Escavador não tenha dados desse processo
→ Tente verificar no painel Escavador se o processo existe

### Erro: "Erro ao salvar no banco"
→ Verifique RLS policies
→ Confirme que a tabela `processos` existe com todas as colunas

---

## ✨ Próximas Features

- [ ] Notificações por email quando há mudança
- [ ] Dashboard com timeline de movimentações
- [ ] Alertas customizados por tipo de processo
- [ ] Exportar relatórios em PDF

---

**Tudo funcionando? Parabéns! 🎉 Sistema de monitoramento ativo!**
