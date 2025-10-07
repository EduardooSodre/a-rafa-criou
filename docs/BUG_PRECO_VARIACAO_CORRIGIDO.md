# 🐛 BUG CRÍTICO CORRIGIDO - Preço de Variação Incorreto

## ❌ PROBLEMA IDENTIFICADO

### Sintoma
- **Frontend:** Produto com variação de R$ 76,00 exibido corretamente
- **Checkout:** Total mostrando R$ 76,00 ✅
- **Stripe:** Cobrando apenas R$ 34,00 ❌ (preço da variação mais barata)

### Causa Raiz

A API `/api/stripe/create-payment-intent` estava **ignorando o preço da variação** e sempre usando o preço base do produto.

**Código problemático:**

```typescript
// ❌ ERRADO - Sempre usava product.price
for (const item of items) {
  const product = dbProducts.find(p => p.id === item.productId);
  total += Number(product.price) * item.quantity; // IGNORA VARIAÇÃO!
}
```

### Impacto

🔴 **CRÍTICO:** Cliente pagando menos do que deveria  
🔴 **Perda de receita** em todos os produtos com variações  
🔴 **Brecha de segurança:** Cliente poderia manipular preços  

---

## ✅ CORREÇÃO APLICADA

### Lógica Corrigida

A API agora:

1. **Busca produtos** da tabela `products`
2. **Busca variações** da tabela `productVariations` (se houver)
3. **Decide qual preço usar:**
   - Se `item.variationId` existe → usa `variation.price` ✅
   - Se não → usa `product.price` ✅

**Código corrigido:**

```typescript
// ✅ CORRETO - Verifica se tem variação
for (const item of items) {
  let itemPrice = 0;

  if (item.variationId) {
    // Usar preço da variação
    const variation = dbVariations.find(v => v.id === item.variationId);
    if (!variation) {
      return Response.json(
        { error: `Variação ${item.variationId} não encontrada` },
        { status: 400 }
      );
    }
    itemPrice = Number(variation.price); // ✅ CORRETO
  } else {
    // Usar preço do produto
    const product = dbProducts.find(p => p.id === item.productId);
    itemPrice = Number(product.price);
  }

  total += itemPrice * item.quantity;
}
```

### Melhorias Adicionadas

1. **Validação de variação:**
   - Verifica se a variação existe no banco
   - Retorna erro 400 se não encontrada

2. **Logs de debug:**
   ```typescript
   console.log('💰 Cálculo de preços:', {
     items: calculationDetails,
     total: total.toFixed(2),
     totalCentavos: Math.round(total * 100),
   });
   ```

3. **Detalhamento:**
   - Nome completo: "Produto - Variação"
   - Preço unitário correto
   - Quantidade
   - Total calculado

---

## 🧪 COMO TESTAR

### 1. Limpar Cache

```bash
# Limpar cache do navegador
localStorage.clear()

# OU apertar Ctrl+Shift+R
```

### 2. Adicionar Produto com Variação

1. Acesse: http://localhost:3000/produtos
2. Escolha produto com múltiplas variações
3. Selecione variação de **R$ 76,00**
4. Adicione ao carrinho

### 3. Verificar no Checkout

```
Carrinho deve mostrar: R$ 76,00 ✅
```

### 4. Verificar Logs do Terminal

**Terminal Next.js deve mostrar:**

```bash
💰 Cálculo de preços: {
  items: [
    {
      name: 'Planilha X - Variação Premium',
      price: 76,
      quantity: 1
    }
  ],
  total: '76.00',
  totalCentavos: 7600
}
```

### 5. Finalizar Pagamento

1. Use cartão teste: `4242 4242 4242 4242`
2. Finalize

**Stripe deve cobrar R$ 76,00 ✅**

### 6. Verificar no Dashboard Stripe

```
Acesse: https://dashboard.stripe.com/test/payments

Valor cobrado: R$ 76,00 ✅
```

---

## 📊 Antes vs Depois

| Cenário | Antes | Depois |
|---------|-------|--------|
| Produto sem variação (R$ 50) | R$ 50,00 ✅ | R$ 50,00 ✅ |
| Variação A (R$ 34) | R$ 34,00 ✅ | R$ 34,00 ✅ |
| Variação B (R$ 76) | **R$ 34,00** ❌ | **R$ 76,00** ✅ |
| Variação C (R$ 120) | **R$ 34,00** ❌ | **R$ 120,00** ✅ |

---

## 🔒 Segurança Implementada

### Validações na API

✅ **Nunca confia no frontend** (busca preços do banco)  
✅ **Valida existência de produtos** (erro 400 se não encontrado)  
✅ **Valida existência de variações** (erro 400 se não encontrada)  
✅ **Verifica total > 0** (erro 400 se inválido)  
✅ **Logs detalhados** (auditoria de valores)  

### Fluxo de Segurança

```
1. Cliente envia: { productId: 'abc', variationId: 'xyz', quantity: 1 }
   ↓
2. API ignora qualquer "price" enviado pelo frontend
   ↓
3. API busca produto e variação no banco
   ↓
4. API calcula total com preços do banco
   ↓
5. API cria Payment Intent com valor correto
   ↓
6. Stripe cobra valor correto ✅
```

---

## 📝 Arquivo Modificado

```
src/app/api/stripe/create-payment-intent/route.ts
```

**Mudanças:**
- ✅ Import de `productVariations` do schema
- ✅ Busca de variações do banco
- ✅ Lógica condicional para preço (variação vs produto)
- ✅ Validação de existência da variação
- ✅ Logs detalhados de cálculo
- ✅ Nome completo do item (produto + variação)

---

## 🎯 Checklist de Verificação

Antes de considerar corrigido, teste:

- [ ] Produto sem variação → Preço correto
- [ ] Produto com variação A → Preço correto
- [ ] Produto com variação B → Preço correto
- [ ] Produto com variação C → Preço correto
- [ ] Múltiplos produtos → Total correto
- [ ] Variação inexistente → Erro 400
- [ ] Logs aparecem no terminal
- [ ] Stripe cobra valor correto
- [ ] E-mail mostra valor correto
- [ ] Pedido salvo com valor correto

---

## 🚨 IMPORTANTE

**Este bug afetava todos os produtos com variações!**

Se já houver pedidos no sistema com valores errados:

1. Revisar pedidos existentes no banco
2. Identificar pedidos com valores incorretos
3. Considerar reembolso/ajuste manual se necessário
4. Verificar relatórios de vendas

**Query para encontrar possíveis problemas:**

```sql
-- Pedidos que podem ter sido afetados
SELECT 
  o.id,
  o.email,
  o.total,
  o.created_at,
  oi.name,
  oi.price,
  oi.quantity
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
WHERE oi.variation_id IS NOT NULL
  AND o.created_at < NOW(); -- Ajustar data da correção
```

---

**Status:** ✅ Bug corrigido  
**Teste:** Selecione variação de R$ 76 e verifique cobrança  
**Prioridade:** 🔴 CRÍTICA (afeta receita)
