# 🎯 COMANDOS ÚTEIS - STRIPE

## 📦 Instalação (JÁ FEITO)

```bash
npm install stripe @stripe/stripe-js @stripe/react-stripe-js
```

---

## 🗄️ Database

### Gerar migration

```bash
npm run db:generate
```

### Aplicar migration

```bash
npm run db:migrate
```

### Ver schema no banco

```bash
npm run db:studio
```

### Reset banco (CUIDADO! Apaga tudo)

```bash
npm run db:push
```

---

## 🔧 Stripe CLI

### Instalar (Windows)

```powershell
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe
```

### Login

```bash
stripe login
```

### Iniciar webhook listener (NECESSÁRIO EM DEV)

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### Ver eventos em tempo real

```bash
stripe listen
```

### Listar últimos eventos

```bash
stripe events list
```

### Simular evento de teste

```bash
stripe trigger payment_intent.succeeded
```

### Ver detalhes de um Payment Intent

```bash
stripe payment_intents retrieve pi_xxxxxxxxxxxxx
```

### Ver logs detalhados (JSON)

```bash
stripe listen --print-json
```

### Ver versão do CLI

```bash
stripe --version
```

### Atualizar CLI

```bash
stripe update
```

---

## 🚀 Next.js

### Rodar em desenvolvimento

```bash
npm run dev
```

### Build de produção

```bash
npm run build
```

### Iniciar em produção

```bash
npm start
```

### Limpar cache

```bash
npm run clean
# ou
rm -rf .next
```

---

## 🧪 Testar Stripe

### Cartões de teste

| Cartão                | Resultado       |
| --------------------- | --------------- |
| `4242 4242 4242 4242` | ✅ Sucesso      |
| `4000 0000 0000 0002` | ❌ Recusado     |
| `4000 0025 0000 3155` | 🔐 3D Secure    |
| `4000 0000 0000 9995` | ⚠️ Insuficiente |
| `4000 0000 0000 0069` | 🔴 Expirado     |

### Criar Payment Intent via CLI

```bash
stripe payment_intents create \
  --amount=2000 \
  --currency=brl \
  --description="Teste"
```

---

## 🔍 Debug

### Ver logs do Next.js

O terminal onde `npm run dev` está rodando.

### Ver logs do Stripe CLI

O terminal onde `stripe listen` está rodando.

### Ver logs no Dashboard Stripe

<https://dashboard.stripe.com/test/logs>

### Ver webhooks no Dashboard

<https://dashboard.stripe.com/test/webhooks>

### Verificar ambiente Next.js

```bash
# Ver todas variáveis de ambiente
printenv | grep STRIPE

# Apenas secret key
echo $STRIPE_SECRET_KEY
```

---

## 📊 Consultas SQL Úteis

### Ver últimos pedidos

```sql
SELECT * FROM orders ORDER BY created_at DESC LIMIT 10;
```

### Ver pedidos com Payment Intent

```sql
SELECT id, user_id, total, stripe_payment_intent_id, payment_status
FROM orders
WHERE stripe_payment_intent_id IS NOT NULL
ORDER BY created_at DESC;
```

### Contar pedidos por status

```sql
SELECT payment_status, COUNT(*) as total
FROM orders
GROUP BY payment_status;
```

### Ver itens de um pedido

```sql
SELECT oi.*, p.name
FROM order_items oi
JOIN products p ON oi.product_id = p.id
WHERE oi.order_id = 'ORDER_ID_AQUI';
```

### Verificar duplicação (idempotência)

```sql
SELECT stripe_payment_intent_id, COUNT(*) as duplicatas
FROM orders
WHERE stripe_payment_intent_id IS NOT NULL
GROUP BY stripe_payment_intent_id
HAVING COUNT(*) > 1;
```

---

## 🔐 Segurança

### Rotacionar chaves Stripe

1. Dashboard Stripe → Developers → API keys
2. Clique "Roll key" ao lado da Secret key
3. Copie nova chave
4. Atualize `.env.local`
5. Redeploy em produção
6. Delete chave antiga após confirmar funcionamento

### Verificar webhook secret está correto

```bash
# No terminal onde stripe listen está rodando,
# você deve ver o webhook secret exibido:
# > Ready! Your webhook signing secret is whsec_xxxxx

# Verifique se é o mesmo no .env.local
cat .env.local | grep STRIPE_WEBHOOK_SECRET
```

---

## 🌍 Produção

### Configurar webhook em produção

1. Dashboard Stripe → Developers → Webhooks
2. Add endpoint: `https://seudominio.com/api/stripe/webhook`
3. Selecionar eventos: `payment_intent.succeeded`
4. Copiar webhook secret
5. Adicionar ao ambiente de produção

### Trocar para Live Mode

```env
# .env.production
STRIPE_SECRET_KEY="sk_live_xxxxx"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_xxxxx"
STRIPE_WEBHOOK_SECRET="whsec_xxxxx_PRODUCAO"
```

### Verificar modo atual

```bash
# Test mode: sk_test_ / pk_test_
# Live mode: sk_live_ / pk_live_
echo $STRIPE_SECRET_KEY | head -c 8
```

---

## 🧹 Limpeza

### Limpar node_modules

```bash
rm -rf node_modules
npm install
```

### Limpar cache Next.js

```bash
rm -rf .next
npm run dev
```

### Limpar todos os caches

```bash
rm -rf node_modules .next
npm install
npm run dev
```

---

## 📚 Links Úteis

- **Dashboard Test:** <https://dashboard.stripe.com/test/dashboard>
- **Dashboard Live:** <https://dashboard.stripe.com/dashboard>
- **API Docs:** <https://stripe.com/docs/api>
- **Testing Docs:** <https://stripe.com/docs/testing>
- **Webhooks Docs:** <https://stripe.com/docs/webhooks>
- **CLI Docs:** <https://stripe.com/docs/stripe-cli>
- **Status Stripe:** <https://status.stripe.com>

---

## 🆘 Suporte

### Logs de erro completos

```bash
# Next.js
npm run dev 2>&1 | tee next.log

# Stripe CLI
stripe listen --forward-to localhost:3000/api/stripe/webhook 2>&1 | tee stripe.log
```

### Reportar issue

1. Copie logs de ambos terminais
2. Copie URL do request no Dashboard Stripe
3. Descreva passos para reproduzir
4. Inclua versões: Node, Next.js, Stripe SDK

### Contato Stripe Support

- Dashboard → Help
- Email: <support@stripe.com>
- Discord: <https://discord.gg/stripe>

---

**Última atualização:** Outubro 2025
