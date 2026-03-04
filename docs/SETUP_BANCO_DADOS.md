# 🗄️ Setup Banco de Dados — Processos

**IMPORTANTE:** Execute os scripts nesta ordem exata!

---

## ✅ Passo 1: Criar Tabela `processos`

Se você recebeu erro `column "numero_processo" does not exist`, é porque a tabela ainda não existe.

**Solução:**

1. Abra o **Supabase SQL Editor**
2. Copie TODO o conteúdo de: `supabase/sql/criar-tabela-processos.sql`
3. Cole no SQL Editor
4. Clique **Run**

**Resultado esperado:**

```
1 row (table processos)
Table information_schema.tables
```

E uma saída mostrando as colunas:

```
 column_name            | data_type           | is_nullable
------------------------+---------------------+------------
 id                     | uuid                | NO
 numero_processo        | text                | NO
 tribunal               | text                | NO
 ultima_movimentacao    | text                | YES
 ultima_movimentacao_data | timestamp         | YES
 last_checked_at        | timestamp           | YES
 ativo                  | boolean             | YES
 user_id                | uuid                | YES
 created_at             | timestamp           | YES
 updated_at             | timestamp           | YES
```

---

## ✅ Passo 2: Inserir os 3 Processos

Agora que a tabela foi criada:

1. Copie TODO o conteúdo de: `supabase/sql/insert-processos-iniciais.sql`
2. Cole no **novo SQL Query**
3. Clique **Run**

**Resultado esperado:**

```
INSERT 0 3

 numero_processo       | tribunal | ativo | created_at
-----------------------+----------+-------+------------------
 1000484-17.2024.8...  | SP       | true  | 2026-03-02 ...
 0000312-21.2026.8...  | SP       | true  | 2026-03-02 ...
 0000313-06.2026.8...  | SP       | true  | 2026-03-02 ...
```

---

## ✅ Passo 3: Verificar (Opcional)

Se quiser confirmar que está tudo certo:

```sql
SELECT numero_processo, tribunal, ativo, created_at
FROM processos
ORDER BY created_at DESC;
```

Deve retornar os 3 processos que você inseriu.

---

## 🎯 Pronto!

Agora você pode prosseguir com:

- `docs/TESTAR_MONITORAMENTO.md` — Testar o sistema
- `docs/RESUMO_IMPLEMENTACAO.md` — Ver um resumo completo

---

## ⚠️ Troubleshooting

### Erro: "Table already exists"

Significa que a tabela já foi criada. Vá direto para o **Passo 2** (inserir processos).

### Erro: "Column does not exist" no INSERT

Volte ao **Passo 1** e execute `criar-tabela-processos.sql` completamente.

### Erro: "Duplicate key value violates unique constraint"

Significa que os 3 processos já foram inseridos. Execute um SELECT para verificar:

```sql
SELECT * FROM processos;
```

---

**Próximo:** Execute `supabase/sql/criar-tabela-processos.sql` no Supabase! 🚀
