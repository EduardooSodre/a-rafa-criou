# ⚡ Configuração Rápida Stripe - 5 Minutos

## 🎯 Checklist Rápido

### ☐ PASSO 1: Criar .env.local
```bash
# Copie .env.example para .env.local
cp .env.example .env.local
```

### ☐ PASSO 2: Obter Chaves Stripe (2 min)

1. **Criar conta:** <https://dashboard.stripe.com/register>
2. **Ativar Test Mode** (toggle no canto superior)
3. **Ir em:** Developers → API keys
4. **Copiar:**
   - Publishable key: `pk_test_...`
   - Secret key: `sk_test_...` (clique "Reveal")

5. **Adicionar ao .env.local:**
```env
STRIPE_SECRET_KEY="sk_test_sua_chave_aqui"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_sua_chave_aqui"
```

### ☐ PASSO 3: Migration (1 min)
```bash
npm run db:generate
npm run db:migrate
```

### ☐ PASSO 4: Instalar Stripe CLI (1 min)

**Windows:**
```powershell
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe
```

**Ou baixe:** <https://github.com/stripe/stripe-cli/releases/latest>

### ☐ PASSO 5: Configurar Webhook Local (1 min)

**Terminal 1 - Stripe CLI:**
```bash
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copie o `whsec_...` que aparecer e adicione ao `.env.local`:
```env
STRIPE_WEBHOOK_SECRET="whsec_sua_chave_aqui"
```

**Terminal 2 - Next.js:**
```bash
npm run dev
```

---

## ✅ TESTAR

1. **Acessar:** <http://localhost:3000/checkout>
2. **Cartão:** `4242 4242 4242 4242`
3. **Data:** 12/25
4. **CVC:** 123
5. **Clicar:** "Finalizar Pagamento"

### Resultado Esperado:
- ✅ Redireciona para `/obrigado`
- ✅ Terminal Stripe CLI mostra: `[200] POST /api/stripe/webhook`
- ✅ Terminal Next.js mostra: `✅ Pedido criado`
- ✅ Banco tem novo registro em `orders`

---

## 🚨 Erros Comuns

| Erro | Solução |
|------|---------|
| "STRIPE_SECRET_KEY is not set" | Reinicie `npm run dev` após editar .env.local |
| "Webhook signature failed" | Copie novo `whsec_...` do terminal Stripe CLI |
| Migration falha | Verifique `DATABASE_URL` no .env.local |
| Checkout vazio | Adicione produto ao carrinho primeiro |

---

## 📁 Arquivos Criados

```
src/
├── lib/
│   └── stripe.ts                              ✅ Cliente Stripe
├── app/
│   ├── api/
│   │   └── stripe/
│   │       ├── create-payment-intent/
│   │       │   └── route.ts                   ✅ API criar pagamento
│   │       └── webhook/
│   │           └── route.ts                   ✅ API receber confirmação
│   └── checkout/
│       └── page.tsx                           ✅ Página de checkout
└── components/
    └── checkout/
        └── StripeForm.tsx                     ✅ Formulário de pagamento
```

---

## 📚 Mais Detalhes

Ver: `CONFIGURACAO_STRIPE.md` (guia completo)

---

**Status:** ✅ Pronto para testar  
**Tempo total:** ~5 minutos
