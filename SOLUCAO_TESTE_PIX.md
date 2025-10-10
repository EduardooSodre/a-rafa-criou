# 🔧 Solução: Teste PIX com Valores Reais

## 🎯 Problema Resolvido

**Antes:**
```bash
stripe trigger payment_intent.succeeded
```
❌ Sempre criava pedido com **$20.00 USD**
❌ Produtos genéricos
❌ Não usava seu carrinho real

**Agora:**
```
Botão: ⚡ Simular Pagamento PIX (Teste)
```
✅ Usa o **Payment Intent que você acabou de criar**
✅ Produtos reais do carrinho
✅ Valor calculado corretamente
✅ Metadata com e-mail e nome

---

## 🚀 Como Usar

### 1. Adicione Produtos ao Carrinho
```
Produto: Planilha de Orçamento - R$ 15,00
Produto: Guia de Finanças - R$ 25,00
─────────────────────────────────────────
Total: R$ 40,00
```

### 2. Clique em "Pagar com PIX"
- Digite seu nome
- Digite seu e-mail
- Clique em "Continuar"

### 3. Na Página de Checkout PIX

Você verá:

```
╔══════════════════════════════════════════╗
║  Pagamento PIX em Processamento          ║
╠══════════════════════════════════════════╣
║                                          ║
║  Valor a pagar                           ║
║  R$ 40,00                      ✅ REAL  ║
║                                          ║
║  ID: pi_xxxxxxxxxxxxx                    ║
║                                          ║
╠══════════════════════════════════════════╣
║  🧪 Modo de Desenvolvimento              ║
║                                          ║
║  [⚡ Simular Pagamento PIX (Teste)]      ║
║  ↑ CLIQUE AQUI                           ║
╚══════════════════════════════════════════╝
```

### 4. Clique no Botão Amarelo

O que acontece:
1. ✅ Confirma o Payment Intent real (pi_xxxxxxxxxxxxx)
2. ✅ Webhook recebe evento com seus dados
3. ✅ Pedido criado com R$ 40,00
4. ✅ Produtos corretos salvos
5. ✅ E-mail enviado com links de download
6. ✅ Redirecionamento automático (3s)

---

## 📊 Verificação no Terminal

Com `stripe listen` rodando, você verá:

```bash
2025-10-10 14:00:00   --> payment_intent.created [evt_123]
2025-10-10 14:00:00  <--  [200] POST /webhook

# Depois de clicar no botão:
2025-10-10 14:00:05   --> payment_intent.succeeded [evt_456]
2025-10-10 14:00:05  <--  [200] POST /webhook

# Logs do seu webhook:
💰 Payment Intent: pi_xxxxxxxxxxxxx
💵 Valor: R$ 40.00 ✅
📦 Produtos:
   ✓ Planilha de Orçamento: R$ 15.00 x 1
   ✓ Guia de Finanças: R$ 25.00 x 1
📧 Cliente: seuemail@example.com
✅ Order created: clxxxxxxxxxxxx
```

---

## 🎓 Diferença Técnica

### stripe trigger (Genérico)
```typescript
// Cria um novo Payment Intent de teste:
{
  id: "pi_random123",
  amount: 2000,  // $20.00 fixo
  currency: "usd",
  metadata: {},  // vazio
  status: "succeeded"
}
```

### Simulação Real (Seu PI)
```typescript
// Usa o Payment Intent que você criou:
{
  id: "pi_xxxxxxxxxxxxx",  // Seu PI
  amount: 4000,  // R$ 40.00 do carrinho
  currency: "brl",
  metadata: {
    customer_email: "seuemail@example.com",
    customer_name: "Seu Nome",
    items: "[{productId:..., quantity:...}]",
    payment_type: "pix"
  },
  status: "succeeded"
}
```

---

## 🔒 Segurança

### Em Desenvolvimento
```typescript
// Rota funciona normalmente
POST /api/stripe/simulate-pix-payment
→ 200 OK { success: true }
```

### Em Produção
```typescript
// Rota bloqueada automaticamente
POST /api/stripe/simulate-pix-payment
→ 403 Forbidden { error: "Não disponível em produção" }
```

O botão **não aparece** em produção (`NODE_ENV === 'production'`)

---

## ✅ Checklist de Teste

Execute este teste completo:

- [ ] Limpe o carrinho
- [ ] Adicione 2+ produtos com valores diferentes
- [ ] Some mentalmente o total (ex: R$ 35,00)
- [ ] Clique "Pagar com PIX"
- [ ] Digite nome e e-mail
- [ ] **Verifique**: Valor na tela = seu cálculo? ✅
- [ ] Copie o Payment Intent ID
- [ ] Clique no botão amarelo
- [ ] **Verifique**: Webhook mostrou o valor correto? ✅
- [ ] Aguarde redirecionamento
- [ ] **Verifique**: Página de obrigado mostra valor correto? ✅
- [ ] **Verifique**: Produtos listados estão corretos? ✅
- [ ] **Verifique**: E-mail recebido? ✅

---

## 🎉 Resultado

Agora você testa PIX com **dados reais do carrinho**, não valores genéricos!

**Arquivos Criados:**
- ✅ `/api/stripe/simulate-pix-payment` - Endpoint de simulação
- ✅ `TESTE_PIX_DESENVOLVIMENTO.md` - Guia completo
- ✅ Botão amarelo no checkout PIX (apenas dev)

**Fluxo:**
```
Carrinho → PIX → Botão Teste → Webhook → Pedido Real ✅
```

Não use mais `stripe trigger payment_intent.succeeded`! 🚫
