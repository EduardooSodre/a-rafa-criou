# 🔴 PROBLEMA: WEBHOOK NÃO ESTÁ RODANDO

## ❌ O que está acontecendo

O pagamento é processado pelo Stripe, mas o **webhook não está criando o pedido no banco**.

**Evidência nos logs:**

```
🔍 Últimos pedidos no banco: []  ← BANCO VAZIO!
```

**Motivo:**
O Stripe CLI (que encaminha webhooks para localhost) **NÃO está rodando**.

---

## ✅ SOLUÇÃO IMEDIATA

### ABRA UM NOVO TERMINAL

**PowerShell ou Terminal separado:**

```bash
# Login no Stripe (só precisa fazer 1x)
stripe login

# Iniciar listener de webhooks (DEIXE RODANDO!)
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

**Você verá:**

```
> Ready! Your webhook signing secret is whsec_xxxxx
```

---

## 🔧 Configuração Completa

### Terminal 1: Stripe CLI (NOVO - ABRA AGORA)

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

**IMPORTANTE:**

- ✅ Deixe este terminal **aberto e rodando**
- ✅ Não feche durante os testes
- ✅ Você verá eventos em tempo real aqui

### Terminal 2: Next.js (já está rodando)

```bash
npm run dev
```

---

## 📊 Como Saber que Funcionou

### Quando fizer novo pagamento:

**Terminal Stripe CLI mostrará:**

```
2025-10-07 15:50:00   --> charge.succeeded [evt_xxx]
2025-10-07 15:50:00   --> payment_intent.succeeded [evt_xxx]
2025-10-07 15:50:00  <--  [200] POST http://localhost:3000/api/stripe/webhook
```

**Terminal Next.js mostrará:**

```
Webhook recebido: payment_intent.succeeded
✅ Order created: 123e4567-e89b-12d3-a456-426614174000
```

**Página /obrigado mostrará:**

```
✅ Parabéns! Compra realizada com sucesso
[Dados do pedido]
```

---

## 🧪 TESTE AGORA

### 1. Abrir terminal Stripe CLI

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### 2. Fazer novo pagamento

1. Limpar cache: `localStorage.clear()` (console F12)
2. Adicionar produto ao carrinho
3. Checkout com `4242 4242 4242 4242`
4. Aguardar redirecionamento

### 3. Verificar logs em AMBOS terminais

**Stripe CLI:** Deve mostrar `[200] POST webhook`  
**Next.js:** Deve mostrar `✅ Order created`

---

## 🔍 Se o Stripe CLI não estiver instalado

### Windows (PowerShell como Admin):

```powershell
# Usando Scoop
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe
```

### Ou download direto:

https://github.com/stripe/stripe-cli/releases/latest

---

## ⚠️ Erro Comum: "Command not found: stripe"

**Solução:**

1. Verifique instalação:

   ```bash
   stripe --version
   ```

2. Se não encontrado, instale via Scoop ou download direto

3. Após instalar, faça login:
   ```bash
   stripe login
   ```

---

## 📝 Resumo Visual

```
┌─────────────────────────────────────────────────┐
│  Terminal 1: Stripe CLI (PRECISA INICIAR!)     │
│  stripe listen --forward-to ...                 │
│  [RODANDO] ✅                                    │
└─────────────────────────────────────────────────┘
                    ↓
         Encaminha webhooks do Stripe
                    ↓
┌─────────────────────────────────────────────────┐
│  Terminal 2: Next.js                            │
│  npm run dev                                    │
│  [RODANDO] ✅                                    │
└─────────────────────────────────────────────────┘
                    ↓
         Processa webhook e cria pedido
                    ↓
┌─────────────────────────────────────────────────┐
│  Banco de Dados PostgreSQL                      │
│  Pedido salvo com stripe_payment_intent_id ✅   │
└─────────────────────────────────────────────────┘
                    ↓
         Página /obrigado busca pedido
                    ↓
┌─────────────────────────────────────────────────┐
│  Navegador: /obrigado                           │
│  ✅ Parabéns! Compra realizada com sucesso      │
└─────────────────────────────────────────────────┘
```

---

## 🎯 Próximo Passo

**ABRA UM NOVO TERMINAL AGORA e execute:**

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

**Depois faça um novo teste de pagamento!**

---

**Status:** ❌ Webhook CLI não iniciado  
**Ação:** Iniciar Stripe CLI em terminal separado  
**Tempo:** ~30 segundos
