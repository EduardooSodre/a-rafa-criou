# ✅ SOLUÇÃO: Executar Migration do Banco

## 🔴 Problema Identificado

```
ERROR: column "stripe_payment_intent_id" does not exist
```

A coluna `stripe_payment_intent_id` foi **adicionada ao schema** do Drizzle, mas **não existe no banco PostgreSQL** ainda.

---

## ✅ SOLUÇÃO IMEDIATA

Execute estes 2 comandos:

### 1. Gerar Migration

```bash
npm run db:generate
```

Isso criará um arquivo SQL em `drizzle/` com a alteração necessária.

### 2. Aplicar Migration

```bash
npm run db:migrate
```

Isso executará o SQL no banco de dados PostgreSQL.

---

## 📋 Passo a Passo Completo

### Terminal PowerShell:

```powershell
# 1. Gerar migration
npm run db:generate

# 2. Aplicar no banco
npm run db:migrate

# 3. Reiniciar servidor Next.js
npm run dev
```

---

## 🔍 O que a Migration Fará

Adicionará a coluna na tabela `orders`:

```sql
ALTER TABLE "orders"
ADD COLUMN "stripe_payment_intent_id" VARCHAR(255) UNIQUE;
```

Essa coluna é **essencial** para:

- ✅ Idempotência (evitar pedidos duplicados)
- ✅ Buscar pedido na página /obrigado
- ✅ Webhook identificar pedidos existentes

---

## ⚠️ Se Der Erro na Migration

### Erro: "Cannot connect to database"

**Solução:**

1. Verifique `DATABASE_URL` no `.env.local`
2. Confirme que o banco PostgreSQL está acessível
3. Teste a conexão:
   ```bash
   npm run db:studio
   ```

### Erro: "Column already exists"

**Solução:**
A coluna já existe, mas migration anterior não foi registrada.

```bash
# Verificar migrations aplicadas
npm run db:studio
# Vá para tabela __drizzle_migrations
```

---

## 📊 Verificar Sucesso

Após executar as migrations:

### 1. Via Drizzle Studio

```bash
npm run db:studio
```

Abra: http://localhost:4983

Vá para tabela `orders` e verifique se a coluna `stripe_payment_intent_id` existe.

### 2. Via SQL Direto (opcional)

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'orders'
AND column_name = 'stripe_payment_intent_id';
```

Deve retornar:

```
column_name              | data_type
stripe_payment_intent_id | character varying
```

---

## 🚀 Depois de Migrar

### 1. Reiniciar servidor

```bash
npm run dev
```

### 2. Testar novo pagamento

1. Adicionar produto ao carrinho
2. Fazer checkout com `4242 4242 4242 4242`
3. Aguardar redirecionamento
4. Página /obrigado deve carregar os dados!

---

## 📝 Migrations Pendentes

Você pode ter outras migrations pendentes também. Verifique:

```bash
# Listar migrations geradas mas não aplicadas
ls drizzle/*.sql
```

Aplique todas:

```bash
npm run db:migrate
```

---

## ✅ Checklist Final

- [ ] Executar `npm run db:generate`
- [ ] Executar `npm run db:migrate`
- [ ] Verificar coluna existe (Drizzle Studio)
- [ ] Reiniciar `npm run dev`
- [ ] Testar pagamento completo
- [ ] Verificar /obrigado carrega dados

---

## 🎯 Comando Rápido (Copie e Cole)

```bash
npm run db:generate && npm run db:migrate && npm run dev
```

Isso fará tudo de uma vez! ⚡
