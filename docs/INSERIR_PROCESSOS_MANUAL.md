# 📋 Inserir Processos Manualmente no Supabase

Siga os passos abaixo para inserir os 3 processos iniciais no banco de dados.

---

## ✅ Passo 1: Acessar Supabase SQL Editor

1. Abra https://app.supabase.com/
2. Selecione seu projeto
3. Vá em **SQL Editor** (menu esquerdo)
4. Clique em **New Query**

---

## ✅ Passo 2: Copiar e Executar o Script

1. Abra o arquivo: `supabase/sql/insert-processos-iniciais.sql`
2. Copie TODO o conteúdo
3. Cole no **Supabase SQL Editor**
4. Clique em **Run** (botão azul)

**Resultado esperado:** 3 linhas inseridas com sucesso

```
INSERT 0 3
```

---

## ✅ Passo 3: Verificar se foi inserido

Já está incluído no script! Ele faz um `SELECT` no final que mostra:

```
 numero_processo       | tribunal | ativo | created_at
-----------------------+----------+-------+------------------
 1000484-17.2024.8...  | SP       | true  | 2026-03-02 ...
 0000312-21.2026.8...  | SP       | true  | 2026-03-02 ...
 0000313-06.2026.8...  | SP       | true  | 2026-03-02 ...
```

---

## 🔄 Próximo Passo: Configurar Monitoramento

A Edge Function `verificar-movimentacoes` agora vai:

1. **Buscar processos ativos** no banco (acaba de inserir 3!)
2. **Chamar API Escavador** com o número do processo
3. **Atualizar movimentações** automaticamente 1x/dia
4. **Notificar você** quando há mudanças

Tudo pronto! 🎯

---

## ⚡ Teste Manual (Opcional)

Para verificar agora mesmo:

```bash
curl -X POST 'https://seu-projeto.supabase.co/functions/v1/verificar-movimentacoes' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

Ele vai retornar algo como:

```json
{
  "success": true,
  "message": "Verificação concluída: 2 atualização(ões)",
  "processos_verificados": 3,
  "atualizacoes": 2,
  "processos_atualizados": [...]
}
```

---

**Pronto!** Seus 3 processos estão no sistema e sendo monitorados. ✅
