# 🚀 Guia Completo de Configuração Stripe

## ✅ STATUS: Implementação Concluída

Todos os arquivos necessários foram criados. Agora vamos configurar!

---

## 📋 PASSO 1: Criar Arquivo .env.local

Crie o arquivo `.env.local` na raiz do projeto com este conteúdo:

```env
# Database
DATABASE_URL="sua_url_do_postgres"

# Auth.js
AUTH_SECRET="sua_secret_key_aleatoria"
AUTH_URL="http://localhost:3000"

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
CLOUDINARY_UPLOAD_PRESET=""

# Cloudflare R2
R2_ACCOUNT_ID=""
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET_NAME=""
R2_PUBLIC_URL=""

# Stripe (DEIXE VAZIO POR ENQUANTO - vamos preencher no passo 2)
STRIPE_SECRET_KEY=""
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=""
STRIPE_WEBHOOK_SECRET=""

# Resend (para emails - pode deixar vazio por enquanto)
RESEND_API_KEY=""
RESEND_FROM_EMAIL=""
```

---

## 📋 PASSO 2: Criar Conta Stripe e Obter Chaves

### 2.1. Criar Conta

1. Acesse: https://dashboard.stripe.com/register
2. Preencha seus dados
3. **IMPORTANTE:** Marque "Ativar modo de teste" (Test Mode)

### 2.2. Obter Chaves da API

1. No Dashboard, clique em **Developers** (canto superior direito)
2. Clique em **API keys** no menu lateral
3. Você verá duas chaves:

   - **Publishable key** (começa com `pk_test_...`)
   - **Secret key** (clique em "Reveal test key" - começa com `sk_test_...`)

4. **Copie as chaves** e adicione ao `.env.local`:

```env
STRIPE_SECRET_KEY="sk_test_XXXXXXXXXXXXXXXXXXXXX"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_XXXXXXXXXXXXXXXXXXXXX"
```

---

## 📋 PASSO 3: Executar Migration do Banco de Dados

Abra o terminal e execute:

```bash
npm run db:generate
npm run db:migrate
```

Isso criará o campo `stripePaymentIntentId` na tabela `orders`.

**Se der erro:**
- Verifique se `DATABASE_URL` está correto no `.env.local`
- Certifique-se de que o banco PostgreSQL está rodando

---

## 📋 PASSO 4: Instalar e Configurar Stripe CLI

### 4.1. Instalar Stripe CLI

**Windows (PowerShell como Admin):**
```powershell
# Usando Scoop
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe
```

**Ou baixe direto:**
https://github.com/stripe/stripe-cli/releases/latest

### 4.2. Login no Stripe CLI

```bash
stripe login
```

- Isso abrirá uma página no navegador
- Clique em "Allow access"
- Volte ao terminal

### 4.3. Configurar Webhook Local

**IMPORTANTE:** Deixe este comando rodando em um terminal separado:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Você verá uma mensagem assim:

```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxxxxxxxxxx
```

**Copie o webhook secret** (`whsec_...`) e adicione ao `.env.local`:

```env
STRIPE_WEBHOOK_SECRET="whsec_xxxxxxxxxxxxxxxxxxxxx"
```

---

## 📋 PASSO 5: Reiniciar Servidor de Desenvolvimento

```bash
npm run dev
```

---

## 🧪 PASSO 6: Testar Checkout

### 6.1. Adicionar Produto ao Carrinho

1. Acesse: http://localhost:3000
2. Navegue até um produto
3. Adicione ao carrinho

### 6.2. Finalizar Compra

1. Acesse: http://localhost:3000/carrinho
2. Clique em "Finalizar Compra"
3. Você será redirecionado para `/checkout`

### 6.3. Preencher Dados de Pagamento

Use estes **cartões de teste** fornecidos pelo Stripe:

| Número do Cartão | Resultado |
|------------------|-----------|
| `4242 4242 4242 4242` | ✅ **Pagamento aprovado** |
| `4000 0000 0000 0002` | ❌ Cartão recusado |
| `4000 0025 0000 3155` | 🔐 Requer autenticação 3D Secure |

**Outros campos:**
- **Data de validade:** Qualquer data futura (ex: 12/25)
- **CVC:** Qualquer 3 dígitos (ex: 123)
- **Nome:** Qualquer nome
- **CEP:** Qualquer CEP (ex: 12345)

### 6.4. Confirmar Pagamento

1. Clique em "Finalizar Pagamento"
2. Aguarde o processamento
3. Você será redirecionado para `/obrigado`

### 6.5. Verificar Webhook

No terminal onde o Stripe CLI está rodando, você verá:

```
[200] POST /api/stripe/webhook [evt_xxxxx]
```

E no terminal do servidor Next.js:

```
✅ Pedido criado com sucesso: <order-id>
```

### 6.6. Verificar Banco de Dados

Abra seu banco de dados e verifique:

**Tabela `orders`:**
- Novo registro com `status = 'completed'`
- Campo `stripePaymentIntentId` preenchido
- Campos `total`, `subtotal`, `paymentProvider = 'stripe'`

**Tabela `order_items`:**
- Registros dos itens do pedido vinculados ao `orderId`

---

## 🎯 Fluxo Completo (Como Funciona)

```
1. Cliente adiciona produtos ao carrinho
   ↓
2. Cliente acessa /checkout
   ↓
3. Frontend chama POST /api/stripe/create-payment-intent
   ↓
4. API busca preços REAIS do banco (segurança!)
   ↓
5. API cria Payment Intent no Stripe
   ↓
6. API retorna clientSecret para o frontend
   ↓
7. Frontend exibe formulário Stripe Elements
   ↓
8. Cliente preenche dados do cartão
   ↓
9. Cliente clica "Finalizar Pagamento"
   ↓
10. Stripe processa o pagamento
    ↓
11. Stripe envia webhook: payment_intent.succeeded
    ↓
12. API /api/stripe/webhook recebe o webhook
    ↓
13. API valida assinatura (segurança!)
    ↓
14. API verifica idempotência (evita duplicação!)
    ↓
15. API cria pedido no banco de dados
    ↓
16. Cliente é redirecionado para /obrigado
    ↓
17. (Próximo passo) E-mail de confirmação enviado
```

---

## 🔧 Troubleshooting

### ❌ Erro: "STRIPE_SECRET_KEY is not set"

**Solução:**
- Verifique se `.env.local` existe na raiz do projeto
- Confirme que a chave está sem aspas extras
- Reinicie o servidor: `npm run dev`

### ❌ Erro: "Invalid API Key provided"

**Solução:**
- Verifique se copiou a chave correta do Dashboard Stripe
- Certifique-se de que está usando chaves de **Test Mode** (pk_test_ e sk_test_)
- Gere novas chaves se necessário

### ❌ Erro: "Webhook signature verification failed"

**Solução:**
- Confirme que `STRIPE_WEBHOOK_SECRET` está correto no `.env.local`
- Verifique se o Stripe CLI está rodando: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
- Copie o novo webhook secret toda vez que reiniciar o Stripe CLI

### ❌ Pedido não é criado após pagamento

**Solução:**
- Verifique logs do Stripe CLI (terminal onde está rodando `stripe listen`)
- Verifique logs do servidor Next.js (busque por "✅ Pedido criado" ou erros)
- Confirme que migration do banco foi executada
- Verifique se `stripePaymentIntentId` existe na tabela `orders`

### ❌ Erro: "Cannot read properties of undefined (reading 'id')"

**Solução:**
- Verifique se produtos existem no banco de dados
- Confirme que `productId` e `variationId` do carrinho são válidos
- Execute seed de produtos: `npm run seed:products` (se disponível)

---

## 📊 Onde Ver os Pagamentos

### Dashboard Stripe

1. Acesse: https://dashboard.stripe.com/test/payments
2. Veja todos os Payment Intents criados
3. Clique em um pagamento para ver detalhes:
   - Metadata (itens do carrinho)
   - Timeline de eventos
   - Webhooks enviados

### Logs Stripe CLI

No terminal onde `stripe listen` está rodando:
- Verde `[200]`: Webhook recebido e processado com sucesso
- Vermelho `[500]`: Erro ao processar webhook

---

## 🎓 Próximos Passos

Após tudo funcionando, implemente:

1. **Resend (Emails)**
   - Enviar confirmação de compra
   - Incluir links de download dos PDFs

2. **Cloudflare R2 (Downloads)**
   - Gerar URLs assinadas para downloads
   - Implementar limite de downloads (5x)
   - Watermark personalizado

3. **Área do Cliente**
   - Página `/conta/pedidos` (histórico)
   - Página `/conta/pedidos/[id]` (detalhes + re-download)

4. **Produção**
   - Criar conta Stripe real (modo live)
   - Trocar chaves de test para live
   - Configurar webhook em produção (não usa Stripe CLI)
   - Adicionar domínio verificado

---

## 📚 Referências

- **Stripe Docs:** https://stripe.com/docs
- **Stripe Testing:** https://stripe.com/docs/testing
- **Stripe CLI:** https://stripe.com/docs/stripe-cli
- **Next.js Stripe:** https://stripe.com/docs/payments/quickstart?lang=node&client=next

---

**Status:** ✅ Tudo pronto para testar!  
**Versão Stripe API:** 2025-08-27.basil  
**Última atualização:** Outubro 2025
