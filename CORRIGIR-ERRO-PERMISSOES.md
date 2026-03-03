# 🔧 Correção: Erro "relation 'user_permissions' does not exist"

## 📋 Problema

Ao clicar no botão **"Sincronizar contas"** na página **Equipe**, aparece o erro:

```
Erro ao sincronizar
relation "user_permissions" does not exist
```

## 🎯 Causa

A tabela `user_permissions` não existe no banco de dados Supabase hospedado. Isso acontece porque as migrations locais não foram aplicadas automaticamente no banco remoto.

## ✅ Solução

### Opção 1: Executar SQL no Supabase Dashboard (RECOMENDADO)

1. **Abra o Supabase Dashboard:**
   - Acesse: https://app.supabase.com
   - Selecione seu projeto

2. **Vá para o SQL Editor:**
   - No menu lateral, clique em **"SQL Editor"**
   - Clique em **"New Query"**

3. **Cole o conteúdo do arquivo `fix-user-permissions.sql`:**
   - Abra o arquivo `fix-user-permissions.sql` na raiz do projeto
   - Copie TODO o conteúdo
   - Cole no SQL Editor do Supabase

4. **Execute o SQL:**
   - Clique no botão **"Run"** (ou pressione `Ctrl+Enter`)
   - Aguarde a mensagem de sucesso

5. **Verifique o resultado:**
   - No final da execução, você verá uma tabela mostrando:
     ```
     tablename          | schemaname | rls_status
     user_permissions   | public     | Enabled
     ```

6. **Teste no sistema:**
   - Volte para a página **Equipe** do seu sistema
   - Clique em **"Sincronizar contas"**
   - Deve funcionar sem erros!

### Opção 2: Usando Supabase CLI (Avançado)

Se você tiver o Supabase CLI configurado localmente:

```bash
# 1. Ir para o diretório do projeto
cd smart-case-mate

# 2. Aplicar todas as migrations pendentes
npx supabase db push

# 3. Ou aplicar apenas a migration específica
npx supabase db push --include-all
```

## 🔍 Verificar se Funcionou

Após aplicar a correção, você pode verificar se a tabela foi criada:

1. No Supabase Dashboard, vá em **"Table Editor"**
2. Procure pela tabela **"user_permissions"**
3. Se ela aparecer na lista, a correção funcionou!

## 📊 Estrutura da Tabela Criada

A tabela `user_permissions` tem a seguinte estrutura:

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | ID único da permissão |
| `user_id` | UUID | Referência ao usuário (auth.users) |
| `module` | TEXT | Nome do módulo (processos, agenda, crm, etc.) |
| `can_view` | BOOLEAN | Se o usuário pode visualizar o módulo |
| `can_edit` | BOOLEAN | Se o usuário pode editar no módulo |

## 🛡️ Segurança (RLS)

A tabela possui **Row Level Security (RLS)** ativado com as seguintes políticas:

1. **"Users read own permissions"**
   - Usuários podem ler suas próprias permissões
   - Admins podem ler permissões de todos

2. **"Admins manage all permissions"**
   - Apenas administradores podem inserir/atualizar/deletar permissões

## ❓ FAQ

### Por que a tabela não foi criada automaticamente?

As migrations do Supabase precisam ser aplicadas manualmente no banco remoto. Isso é uma medida de segurança para evitar alterações acidentais.

### Vou perder algum dado ao executar o SQL?

Não! O SQL usa `CREATE TABLE IF NOT EXISTS`, que só cria a tabela se ela não existir. Dados existentes são preservados.

### O erro pode voltar?

Não, uma vez que a tabela é criada, ela permanecerá no banco de dados.

## 📞 Suporte

Se o erro persistir após seguir este guia:

1. Verifique se você tem permissões de administrador no Supabase
2. Confira se está executando o SQL no projeto correto
3. Verifique os logs de erro no console do navegador (F12)

---

**🎉 Pronto! Após aplicar a correção, o botão "Sincronizar contas" funcionará perfeitamente!**
