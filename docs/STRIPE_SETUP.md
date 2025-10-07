# 🚀 Setup Stripe - Guia Rápido

## ✅ Arquivos Criados

Todos os arquivos necessários para integração Stripe foram criados:

1. **`src/lib/stripe.ts`** - Cliente Stripe (server-side)
2. **`src/app/api/stripe/create-payment-intent/route.ts`** - API para criar Payment Intent
3. **`src/app/api/stripe/webhook/route.ts`** - API para receber webhooks do Stripe
4. **`src/components/checkout/StripeForm.tsx`** - Componente de checkout com Stripe Elements
5. **`src/app/checkout/page.tsx`** - Página de checkout
6. **`src/app/obrigado/page.tsx`** - Página de confirmação
7. **`src/lib/db/schema.ts`** - Schema atualizado com campo `stripePaymentIntentId`

## 📋 Próximos Passos

### 1. Configurar Credenciais Stripe

1. Acesse: https://dashboard.stripe.com/register
2. Crie uma conta Stripe (modo test)
3. No Dashboard, vá em **Developers → API keys**
4. Copie as chaves:
   - **Publishable key** (pk_test_...)
   - **Secret key** (sk_test_...)

5. Adicione ao [`.env.local`](.env.local ):

```env
STRIPE_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_placeholder
```

### 2. Executar Migration do Banco

```bash
npm run db:generate
npm run db:migrate
```

Isso adicionará o campo `stripePaymentIntentId` na tabela `orders`.

### 3. Configurar Stripe CLI (Webhooks Locais)

```bash
# Instalar Stripe CLI
npm install -g stripe

# Login no Stripe
stripe login

# Forward webhooks para localhost
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copie o **webhook secret** (`whsec_...`) exibido e adicione ao [`.env.local`](.env.local ):

```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

### 4. Reiniciar Servidor Dev

```bash
npm run dev
```

### 5. Testar Checkout

1. Acesse: `http://localhost:3000/checkout`
2. Use cartão de teste:
   - **Número:** `4242 4242 4242 4242`
   - **Data:** Qualquer data futura
   - **CVC:** Qualquer 3 dígitos
3. Clique em "Finalizar Pagamento"
4. Verifique:
   - Redirecionamento para `/obrigado`
   - No terminal Stripe CLI: webhook `payment_intent.succeeded` recebido
   - No banco: pedido criado na tabela `orders`

## 🧪 Cartões de Teste

| Cartão | Resultado |
|--------|-----------|
| `4242 4242 4242 4242` | ✅ Pagamento aprovado |
| `4000 0000 0000 0002` | ❌ Pagamento declinado |
| `4000 0025 0000 3155` | 🔐 Requer autenticação (3D Secure) |

## 🔧 Troubleshooting

### Erro: "STRIPE_SECRET_KEY não configurada"

- Verifique se `.env.local` existe e contém a chave
- Reinicie o servidor dev após adicionar variáveis

### Erro: "Webhook signature verification failed"

- Certifique-se de que `STRIPE_WEBHOOK_SECRET` está correto
- Verifique se Stripe CLI está rodando: `stripe listen --forward-to localhost:3000/api/stripe/webhook`

### Pedido não é criado após pagamento

- Verifique no terminal Stripe CLI se webhook foi recebido
- Verifique logs do servidor (`console.log` no webhook)
- Confirme que migration do banco foi executada

## 📊 Fluxo Completo

```
1. Cliente acessa /checkout
2. Frontend chama /api/stripe/create-payment-intent
3. API busca preços reais do banco
4. API cria Payment Intent no Stripe
5. Frontend recebe clientSecret
6. Cliente preenche cartão (Stripe Elements)
7. Cliente confirma pagamento
8. Stripe processa pagamento
9. Stripe envia webhook payment_intent.succeeded
10. API /api/stripe/webhook cria pedido no banco
11. Cliente é redirecionado para /obrigado
12. (Próxima etapa) E-mail enviado com links de download
```

## ✨ API Version

Usando versão estável: **2025-08-27.basil**

## 🎯 Próximas Implementações

- [ ] **Resend** (envio de e-mails)
- [ ] **Área do Cliente** (`/conta/pedidos`)
- [ ] **Downloads** (gerar URLs assinadas R2)
- [ ] **PayPal** (método de pagamento alternativo)
- [ ] **Rate Limiting** (proteção contra abuso)

---

**Status:** ✅ Implementação Base Completa  
**Data:** Outubro 2025
