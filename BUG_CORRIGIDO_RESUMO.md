# 🐛 BUG CRÍTICO CORRIGIDO - Preço de Variação

## ❌ PROBLEMA

Você selecionava produto com variação de **R$ 76,00**, mas o Stripe cobrava apenas **R$ 34,00** (preço da variação mais barata).

### Causa

A API `create-payment-intent` estava **sempre usando o preço do produto base**, ignorando o preço da variação selecionada.

```typescript
// ❌ ANTES (ERRADO)
total += Number(product.price) * item.quantity; // Ignora variação!
```

---

## ✅ SOLUÇÃO APLICADA

Agora a API verifica se há variação e usa o preço correto:

```typescript
// ✅ DEPOIS (CORRETO)
if (item.variationId) {
  // Busca e usa preço da VARIAÇÃO
  const variation = dbVariations.find(v => v.id === item.variationId);
  itemPrice = Number(variation.price); // R$ 76,00 ✅
} else {
  // Usa preço do produto
  itemPrice = Number(product.price);
}
```

---

## 🧪 TESTE AGORA

1. **Limpe o cache:**
   ```bash
   localStorage.clear()
   # Ou Ctrl+Shift+R no navegador
   ```

2. **Adicione produto com variação de R$ 76:**
   - Vá em `/produtos`
   - Selecione variação de R$ 76,00
   - Adicione ao carrinho

3. **Finalize o pagamento:**
   - Cartão: `4242 4242 4242 4242`
   - Finalize

4. **Verifique os logs do terminal:**
   ```bash
   💰 Cálculo de preços: {
     items: [{ name: '...', price: 76, quantity: 1 }],
     total: '76.00',
     totalCentavos: 7600  ✅ CORRETO!
   }
   ```

5. **Stripe deve cobrar R$ 76,00** ✅

---

## 📊 Antes vs Depois

| Variação | Preço | Antes (Bug) | Depois (Corrigido) |
|----------|-------|-------------|-------------------|
| Básica | R$ 34 | R$ 34 ✅ | R$ 34 ✅ |
| Premium | R$ 76 | R$ 34 ❌ | R$ 76 ✅ |
| Pro | R$ 120 | R$ 34 ❌ | R$ 120 ✅ |

---

## 🔒 Segurança

✅ Preços sempre buscados do banco (nunca confia no frontend)  
✅ Valida existência de produto e variação  
✅ Logs detalhados para auditoria  
✅ Erro 400 se variação não encontrada  

---

## 📝 Arquivo Modificado

```
src/app/api/stripe/create-payment-intent/route.ts
```

**Mudanças:**
- Importa `productVariations` do schema
- Busca variações do banco quando `variationId` existe
- Usa `variation.price` em vez de `product.price`
- Adiciona logs detalhados de cálculo

---

## 🚨 IMPORTANTE

Se já tiver pedidos com valores errados no banco, você pode precisar:

1. Revisar pedidos com variações
2. Identificar cobranças incorretas
3. Considerar ajustes/reembolsos

**Query para verificar:**

```sql
SELECT o.id, o.email, o.total, oi.name, oi.price
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
WHERE oi.variation_id IS NOT NULL;
```

---

**Status:** ✅ CORRIGIDO  
**Teste:** Selecione variação R$ 76 e verifique se cobra corretamente  
**Documentação:** `docs/BUG_PRECO_VARIACAO_CORRIGIDO.md`
