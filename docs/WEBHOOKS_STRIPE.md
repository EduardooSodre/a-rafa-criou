# 🎯 SETUP WEBHOOKS STRIPE - Passo a Passo

## 📋 O que são Webhooks?

Webhooks permitem que o Stripe **notifique automaticamente** seu servidor quando um pagamento é confirmado. Sem webhooks, seu sistema não saberia quando criar o pedido no banco de dados!

---

## 🔧 Configuração em DESENVOLVIMENTO (localhost)

### 1️⃣ Instalar Stripe CLI

O Stripe CLI funciona como um "túnel" que encaminha webhooks do Stripe para seu localhost.

**Windows (PowerShell como Admin):**

```powershell
# Usando Scoop (gerenciador de pacotes)
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe
```

**Alternativa - Download Direto:**

1. Baixe: <https://github.com/stripe/stripe-cli/releases/latest>
2. Descompacte o arquivo `stripe.exe`
3. Mova para `C:\Program Files\Stripe\`
4. Adicione ao PATH do Windows

**Verificar instalação:**

```bash
stripe --version
```

---

### 2️⃣ Fazer Login no Stripe

```bash
stripe login
```

Isso vai:

- Abrir uma página no navegador
- Pedir autorização para vincular o CLI à sua conta
- Após clicar "Allow access", você está conectado!

---

### 3️⃣ Iniciar Listener de Webhooks

**IMPORTANTE:** Este comando precisa ficar **sempre rodando** durante desenvolvimento!

Abra um terminal separado e execute:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Você verá algo assim:

```text
> Ready! Your webhook signing secret is whsec_1234567890abcdefghijklmnopqrstuv

2024-10-07 14:30:15   --> charge.succeeded [evt_xxx]
2024-10-07 14:30:15  <--  [200] POST http://localhost:3000/api/stripe/webhook
```

### 🔑 Copiar Webhook Secret

Copie o código que começa com `whsec_...` e adicione ao `.env.local`:

```env
STRIPE_WEBHOOK_SECRET="whsec_1234567890abcdefghijklmnopqrstuv"
```

---

### 4️⃣ Reiniciar Servidor Next.js

**Toda vez** que atualizar `.env.local`, reinicie:

```bash
# Ctrl+C para parar
npm run dev
```

---

## ✅ Testar se Funciona

### Teste 1: Fazer um Pagamento de Teste

1. Acesse: <http://localhost:3000/checkout>
2. Use cartão de teste: `4242 4242 4242 4242`
3. Data: `12/25` | CVC: `123`
4. Clique "Finalizar Pagamento"

### Teste 2: Verificar Logs

**No terminal do Stripe CLI**, você deve ver:

```text
2024-10-07 14:35:20   --> payment_intent.succeeded [evt_xxx]
2024-10-07 14:35:20  <--  [200] POST http://localhost:3000/api/stripe/webhook
```

- `[200]` = ✅ Webhook recebido e processado com sucesso
- `[500]` = ❌ Erro no processamento (verifique logs do Next.js)

**No terminal do Next.js**, você deve ver:

```text
Webhook recebido: payment_intent.succeeded
✅ Pedido criado com sucesso: 123e4567-e89b-12d3-a456-426614174000
```

### Teste 3: Verificar Banco de Dados

Abra seu banco PostgreSQL e veja a tabela `orders`:

```sql
SELECT * FROM orders ORDER BY created_at DESC LIMIT 1;
```

Você deve ver:

- `status = 'completed'`
- `payment_provider = 'stripe'`
- `stripe_payment_intent_id` preenchido
- `paid_at` com data/hora

---

## 🚨 Troubleshooting

### ❌ "Webhook signature verification failed"

**Causa:** Webhook secret incorreto ou desatualizado.

**Solução:**

1. Verifique o terminal do Stripe CLI
2. Copie novamente o `whsec_...` exibido
3. Cole no `.env.local`
4. Reinicie `npm run dev`

### ❌ Webhook não aparece nos logs

**Causa:** Stripe CLI não está rodando.

**Solução:**

```bash
# Em um terminal separado
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### ❌ "[500] POST webhook" (erro 500)

**Causa:** Erro no código do webhook handler.

**Solução:**

1. Veja logs do Next.js (terminal onde `npm run dev` está rodando)
2. Procure por mensagens de erro
3. Verifique se migration do banco foi executada:

```bash
npm run db:migrate
```

### ❌ "This event (evt_xxx) is too old to be processed"

**Causa:** Stripe CLI foi reiniciado e está reenviando eventos antigos.

**Solução:** Ignore, é normal. Faça um novo pagamento de teste.

---

## 🌐 Configuração em PRODUÇÃO

### Quando deploy em produção (Vercel, Railway, etc.):

**1. Ir no Dashboard Stripe (modo Live)**

- Ative **Live Mode** (toggle no canto superior)
- Vá em: Developers → Webhooks
- Clique: "Add endpoint"

**2. Configurar Endpoint**

- **URL:** `https://seudominio.com.br/api/stripe/webhook`
- **Eventos:** Selecione `payment_intent.succeeded`
- Clique "Add endpoint"

**3. Obter Webhook Secret de Produção**

- Clique no endpoint criado
- Em "Signing secret", clique "Reveal"
- Copie o `whsec_...`
- Adicione às variáveis de ambiente da produção:

```env
STRIPE_WEBHOOK_SECRET="whsec_xxx_PRODUCAO"
```

**4. Trocar Chaves para Live**

```env
# Obtenha em: Developers → API keys (Live Mode)
STRIPE_SECRET_KEY="sk_live_xxx"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_xxx"
```

---

## 📊 Resumo Visual

```text
┌─────────────┐
│   Cliente   │ Preenche cartão no /checkout
└─────┬───────┘
      │
      ▼
┌─────────────────────────┐
│  Stripe Elements (JS)   │ Envia dados do cartão diretamente
└─────┬───────────────────┘ para Stripe (não passa pelo servidor)
      │
      ▼
┌─────────────────────────┐
│   Stripe API (Cloud)    │ Processa pagamento
└─────┬───────────────────┘
      │
      ├──► Frontend: Redireciona para /obrigado
      │
      └──► Webhook: POST /api/stripe/webhook
                    │
                    ▼
           ┌─────────────────────┐
           │ Seu Servidor Next.js│
           │ 1. Valida assinatura│
           │ 2. Cria pedido no DB│
           │ 3. (Futuro) Envia e-mail│
           └─────────────────────┘
```

---

## 🎓 Eventos Úteis do Stripe

Você pode escutar outros eventos além de `payment_intent.succeeded`:

| Evento | Quando usar |
|--------|-------------|
| `payment_intent.succeeded` | ✅ Criar pedido (JÁ IMPLEMENTADO) |
| `payment_intent.payment_failed` | ❌ Notificar cliente sobre falha |
| `charge.refunded` | 💰 Processar reembolso |
| `customer.subscription.created` | 📅 Assinaturas recorrentes |

---

## ✨ Comandos Úteis Stripe CLI

```bash
# Ver eventos em tempo real
stripe listen

# Ver últimos eventos
stripe events list

# Trigger evento de teste
stripe trigger payment_intent.succeeded

# Ver logs detalhados
stripe listen --print-json
```

---

**Pronto!** 🎉 Webhooks configurados e funcionando!

**Próximo passo:** Implementar envio de e-mails com Resend após confirmação de pagamento.
