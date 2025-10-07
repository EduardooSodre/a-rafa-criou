# 🔍 DEBUG: Pedido não encontrado

## Problema

A página `/obrigado` está retornando erro "Pedido não encontrado" ao tentar buscar o pedido pelo `payment_intent`.

## Possíveis Causas

### 1. Webhook não criou o pedido

**Verificar:**

- Stripe CLI está rodando?
- Webhook foi recebido e processado?
- Houve erro no webhook?

**Terminal Stripe CLI deve mostrar:**

```
--> payment_intent.succeeded [evt_xxx]
<-- [200] POST http://localhost:3000/api/stripe/webhook
```

Se mostra `[500]` ou `[400]`, há erro no webhook.

### 2. Timing issue (race condition)

O Stripe redireciona **imediatamente** após o pagamento, mas o webhook pode demorar alguns segundos para processar e criar o pedido no banco.

**Fluxo problemático:**

```
1. Cliente confirma pagamento (t=0s)
2. Stripe redireciona para /obrigado (t=0.5s)
3. Página busca pedido (t=1s) ❌ AINDA NÃO EXISTE
4. Webhook cria pedido (t=2s) ✅ AGORA EXISTE
```

### 3. Payment Intent ID diferente

O `payment_intent` na URL pode estar diferente do `stripePaymentIntentId` salvo no banco.

## Soluções

### Solução 1: Adicionar retry automático

Tentar buscar o pedido múltiplas vezes com delay.

**Atualizar `/obrigado/page.tsx`:**

```tsx
const fetchOrder = async (retries = 5, delay = 2000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(`/api/orders/by-payment-intent?payment_intent=${paymentIntent}`);

      if (response.ok) {
        const data = await response.json();
        setOrderData(data);
        return; // Sucesso!
      }

      // Se não encontrou, aguardar e tentar novamente
      if (i < retries - 1) {
        console.log(`⏳ Tentativa ${i + 1}/${retries} - Aguardando webhook...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    } catch (err) {
      console.error('Erro ao buscar pedido:', err);
    }
  }

  // Após todas tentativas, mostrar erro
  setError('Pedido ainda está sendo processado. Aguarde alguns segundos e recarregue a página.');
  setIsLoading(false);
};
```

### Solução 2: Verificar logs do webhook

**No terminal Next.js, procurar por:**

```
Webhook recebido: payment_intent.succeeded
✅ Pedido criado com sucesso: [uuid]
```

**Se não aparecer:**

- Webhook não está rodando
- Webhook deu erro
- Event type diferente

### Solução 3: Debug com logs

Adicionei logs na API `/api/orders/by-payment-intent`:

```typescript
console.log('🔍 Buscando pedido com payment_intent:', paymentIntentId);
console.log('📦 Resultado da busca:', orderResult.length > 0 ? 'Encontrado' : 'NÃO encontrado');
console.log('🔍 Últimos pedidos no banco:', allOrders);
```

**Verificar logs no terminal Next.js após erro.**

## Como Testar

### 1. Ativar logs detalhados

Os logs já foram adicionados automaticamente.

### 2. Fazer nova compra de teste

```bash
# Terminal 1 - Stripe CLI
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Terminal 2 - Next.js
npm run dev
```

### 3. No navegador

1. Fazer checkout com `4242 4242 4242 4242`
2. Observar redirecionamento para `/obrigado`
3. Abrir console do navegador (F12)
4. Verificar terminal Next.js

### 4. Analisar logs

**Terminal Next.js deve mostrar:**

```
🔍 Buscando pedido com payment_intent: pi_xxxxx
📦 Resultado da busca: Pedido encontrado!
```

**Ou se não encontrou:**

```
🔍 Buscando pedido com payment_intent: pi_xxxxx
📦 Resultado da busca: Pedido NÃO encontrado
🔍 Últimos pedidos no banco: [
  { id: 'uuid1', stripePaymentIntentId: 'pi_yyyy', createdAt: '...' },
  { id: 'uuid2', stripePaymentIntentId: 'pi_zzzz', createdAt: '...' }
]
```

Compare o `payment_intent` buscado com os IDs no banco.

## Solução Rápida (Implementar Agora)

Vou implementar retry automático com feedback visual:

```tsx
// Mostrar mensagem enquanto aguarda webhook
'⏳ Processando seu pedido... Aguarde alguns segundos.';
```

Após 3 tentativas de 2 segundos cada (6 segundos total), se ainda não encontrar:

```tsx
"⚠️ Seu pedido está sendo processado.
Recarregue esta página em alguns segundos ou
verifique seu email para confirmação."
```

## Próximo Passo

Vou implementar o retry automático agora.
