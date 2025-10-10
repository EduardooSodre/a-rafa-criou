# 🧪 Testando PIX em Desenvolvimento

## ⚠️ Problema: `stripe trigger payment_intent.succeeded`

O comando `stripe trigger payment_intent.succeeded` **NÃO usa seus Payment Intents reais**!

### O que acontece:
```bash
stripe trigger payment_intent.succeeded
```

❌ Cria um **Payment Intent genérico de teste**:
- Valor fixo: **$20.00 USD**
- Sem produtos reais
- Sem metadata do seu carrinho
- Sem cliente real

### Por que isso acontece?
O Stripe CLI gera eventos de amostra para testar webhooks, não eventos dos seus Payment Intents específicos.

---

## ✅ Solução: Simulação Real do Payment Intent

### Método 1: Botão de Simulação (RECOMENDADO)

Quando você clicar em "Pagar com PIX" e chegar na página de checkout:

1. **Em Desenvolvimento**, você verá uma caixa amarela:
   ```
   🧪 Modo de Desenvolvimento
   
   PIX não funciona em modo de teste. Use o botão abaixo para
   simular o pagamento do Payment Intent específico que você criou:
   
   [⚡ Simular Pagamento PIX (Teste)]
   ```

2. **Clique no botão amarelo**
   - ✅ Confirma o Payment Intent real que você acabou de criar
   - ✅ Usa os produtos reais do carrinho
   - ✅ Usa o valor real calculado
   - ✅ Usa a metadata com e-mail e nome
   - ✅ Dispara o webhook automaticamente

3. **O que acontece:**
   - POST para `/api/stripe/simulate-pix-payment`
   - Confirma o Payment Intent específico
   - Webhook processa com dados corretos
   - Pedido criado com produtos e valores reais
   - Redireciona para página de obrigado

---

### Método 2: Endpoint Manual (Alternativo)

Se preferir usar cURL ou Postman:

```bash
# 1. Copie o Payment Intent ID da tela (ex: pi_xxxxxxxxxxxxx)

# 2. Execute:
curl -X POST http://localhost:3000/api/stripe/simulate-pix-payment \
  -H "Content-Type: application/json" \
  -d '{"paymentIntentId": "pi_xxxxxxxxxxxxx"}'
```

---

## 🔍 Comparação

| Método | Payment Intent | Produtos | Valor | Metadata |
|--------|---------------|----------|-------|----------|
| `stripe trigger` | ❌ Genérico | ❌ Nenhum | ❌ $20 fixo | ❌ Vazio |
| Botão Simulação | ✅ Seu PI real | ✅ Do carrinho | ✅ Calculado | ✅ Email/Nome |

---

## 📋 Fluxo Completo de Teste

### Passo a Passo:

1. **Adicione produtos ao carrinho**
   ```
   - Produto A (R$ 15,00) x2
   - Produto B (R$ 20,00) x1
   Total: R$ 50,00
   ```

2. **Clique em "Pagar com PIX"**
   - Digite nome e e-mail
   - Redireciona para `/checkout/pix`

3. **Verifique o Payment Intent criado**
   - Valor exibido: **R$ 50,00** ✅
   - Payment Intent ID: `pi_xxxxxxxxxxxxx`

4. **Clique no botão amarelo de teste**
   ```
   ⚡ Simular Pagamento PIX (Teste)
   ```

5. **Aguarde o webhook processar**
   - Aparece alerta: "✅ Pagamento simulado! Aguarde o webhook processar..."
   - Polling detecta sucesso (3 segundos)
   - Redireciona automaticamente

6. **Página de Obrigado**
   - Pedido criado com **R$ 50,00** ✅
   - Produtos corretos listados ✅
   - Links de download funcionando ✅

---

## 🚨 Importante: Segurança

### A rota de simulação está protegida:

```typescript
// Em produção, retorna 403 Forbidden
if (process.env.NODE_ENV === 'production') {
  return NextResponse.json(
    { error: 'Esta rota não está disponível em produção' },
    { status: 403 }
  );
}
```

✅ **Não funciona em produção**
✅ **Botão não aparece em produção**
✅ **Apenas para desenvolvimento local**

---

## 🎯 Terminal Stripe CLI

Mantenha o Stripe CLI rodando para ver os webhooks:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

**O que você verá:**
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx

2025-10-10 13:45:20   --> payment_intent.created [evt_xxxxx]
2025-10-10 13:45:20  <--  [200] POST /api/stripe/webhook

# Depois de clicar no botão de simulação:
2025-10-10 13:45:25   --> payment_intent.succeeded [evt_yyyyy]
2025-10-10 13:45:25  <--  [200] POST /api/stripe/webhook
✅ Order created: clxxxxxxxxxxxx
```

---

## 📊 Verificando os Dados Corretos

### No Webhook (Terminal Stripe CLI):
Você verá os logs com os dados reais:
```
💰 Payment Intent: pi_xxxxxxxxxxxxx
💵 Valor: R$ 50.00
📦 Produtos:
   ✓ Produto A (Variação X): R$ 15.00 x 2
   ✓ Produto B (Variação Y): R$ 20.00 x 1
📧 Cliente: seuemail@example.com
```

### No Banco de Dados:
```sql
SELECT * FROM orders WHERE stripe_payment_intent_id = 'pi_xxxxxxxxxxxxx';

-- Resultado:
-- total: "50.00"
-- currency: "BRL"
-- email: "seuemail@example.com"
```

### No E-mail:
O cliente recebe e-mail com:
- Valor correto: R$ 50,00
- Produtos corretos
- Links de download válidos

---

## 🔄 Resetar e Testar Novamente

Se quiser testar novamente:

1. Limpe o carrinho
2. Adicione novos produtos (com valores diferentes)
3. Repita o fluxo
4. Verifique que os valores mudam conforme o carrinho

---

## ✅ Checklist de Teste

- [ ] Carrinho com produtos reais
- [ ] Valor calculado corretamente
- [ ] Stripe CLI rodando (`stripe listen`)
- [ ] Clique em "Pagar com PIX"
- [ ] Preencha nome e e-mail
- [ ] Veja o valor correto na tela (não $20!)
- [ ] Clique no botão amarelo de teste
- [ ] Webhook processa com sucesso
- [ ] Redirecionamento automático
- [ ] Página de obrigado mostra valor correto
- [ ] E-mail recebido com produtos corretos

---

## 🎓 Resumo

| ❌ Não Use | ✅ Use |
|-----------|-------|
| `stripe trigger payment_intent.succeeded` | Botão "Simular Pagamento PIX" |
| Valores genéricos ($20) | Valores reais do carrinho |
| Payment Intents aleatórios | Seu Payment Intent específico |

**Resultado**: Teste com dados reais, igual a produção! 🎉
