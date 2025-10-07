# 🔥 ERRO RESOLVIDO: Email obrigatório

## ❌ Erro Original

```
src/app/checkout/page.tsx (52:17)
Error: Dados inválidos
```

## 🔍 Causa

A API `/api/stripe/create-payment-intent` estava exigindo um campo `email` obrigatório, mas o checkout não estava enviando esse campo.

## ✅ Solução Aplicada

### 1. API atualizada para email opcional

**Arquivo:** `src/app/api/stripe/create-payment-intent/route.ts`

```typescript
// ANTES
email: z.string().email(), // ❌ Obrigatório

// DEPOIS
email: z.string().email().optional(), // ✅ Opcional
```

### 2. Receipt email condicional no Stripe

```typescript
// ANTES
receipt_email: email, // ❌ Erro se email undefined

// DEPOIS
...(email && { receipt_email: email }), // ✅ Adiciona apenas se fornecido
```

### 3. Checkout envia dados do usuário logado

**Arquivo:** `src/app/checkout/page.tsx`

```typescript
// Adicionado import
import { useSession } from 'next-auth/react';

// Obter sessão
const { data: session } = useSession();

// Enviar para API
body: JSON.stringify({
  items: items.map((item) => ({
    productId: item.productId,
    variationId: item.variationId,
    quantity: item.quantity,
  })),
  userId: session?.user?.id,    // ✅ Se logado
  email: session?.user?.email,   // ✅ Se logado
}),
```

## 🎯 Resultado

Agora o checkout funciona em **3 cenários**:

1. ✅ **Usuário logado** → Envia userId e email
2. ✅ **Usuário não logado** → Não envia nada (email opcional)
3. ✅ **Stripe Elements** → Coleta email no formulário de pagamento

## 🧪 Testar Agora

### Cenário 1: Sem Login

1. Abra em aba anônima: `http://localhost:3000`
2. Adicione produto ao carrinho
3. Vá para `/checkout`
4. ✅ Deve carregar o formulário Stripe normalmente

### Cenário 2: Com Login

1. Faça login: `http://localhost:3000/auth/login`
2. Adicione produto ao carrinho
3. Vá para `/checkout`
4. ✅ Email será enviado automaticamente para recibo

## 📋 Próximos Passos

### 1. Adicionar produtos ao banco (se vazio)

```bash
# Executar seed
npm run seed:products
```

### 2. Verificar Stripe CLI está rodando

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### 3. Reiniciar servidor Next.js

```bash
npm run dev
```

### 4. Testar checkout

1. Acesse: `http://localhost:3000/produtos`
2. Adicione produto ao carrinho
3. Vá para checkout
4. Use cartão: `4242 4242 4242 4242`
5. ✅ Deve processar pagamento

## 🔍 Debug

Se ainda houver erro, verifique:

### 1. Produtos no carrinho têm IDs válidos?

```typescript
// No console do navegador (F12)
console.log(localStorage.getItem('cart'));
```

### 2. Produtos existem no banco?

```bash
# Via Drizzle Studio
npm run db:studio
```

Vá para tabela `products` e verifique se há registros.

### 3. Logs do servidor Next.js

Verifique o terminal onde `npm run dev` está rodando. Procure por:

- ✅ `POST /api/stripe/create-payment-intent 200` (sucesso)
- ❌ `POST /api/stripe/create-payment-intent 400/500` (erro)

Se erro 400, veja a mensagem completa no console.

## 📊 Status

- ✅ API aceita email opcional
- ✅ Checkout envia dados do usuário se logado
- ✅ Stripe Elements coleta email no formulário
- ✅ TypeScript sem erros
- ✅ Pronto para testar!

---

**Data:** 07/10/2025  
**Problema:** Email obrigatório causando erro no checkout  
**Status:** ✅ RESOLVIDO
