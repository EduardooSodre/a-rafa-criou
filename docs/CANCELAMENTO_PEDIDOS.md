# ✅ Cancelamento de Pedidos PIX

## 📋 Visão Geral

Implementação completa do fluxo de cancelamento de pedidos pendentes quando o usuário clica em "Cancelar e voltar ao carrinho" na página de checkout PIX.

---

## 🔧 Componentes Implementados

### 1. **API de Cancelamento** (`/api/orders/cancel`)

**Arquivo:** `src/app/api/orders/cancel/route.ts`

**Método:** `POST`

**Body:**

```json
{
  "orderId": "uuid-do-pedido"
}
```

**Fluxo de Segurança:**

1. ✅ **Validação do pedido:**
   - Verifica se o `orderId` foi fornecido
   - Busca o pedido no banco de dados
   - Retorna 404 se não encontrado

2. ✅ **Validação de status:**
   - Se já está `cancelled`: Retorna sucesso (idempotente)
   - Se está `completed`: Retorna erro 400 (não pode cancelar pedido pago)
   - Se não está `pending`: Retorna erro 400 (apenas pendentes podem ser cancelados)

3. ✅ **Cancelamento no Stripe:**
   - Busca o Payment Intent no Stripe
   - Cancela apenas se o status permitir (`!= succeeded && != canceled`)
   - Continua mesmo se falhar (garante cancelamento no DB)
   - Logs detalhados de cada etapa

4. ✅ **Atualização no banco:**
   - Define `status = 'cancelled'`
   - Atualiza `updatedAt` com timestamp atual
   - Retorna sucesso

**Resposta de Sucesso:**

```json
{
  "success": true,
  "message": "Pedido cancelado com sucesso"
}
```

**Possíveis Erros:**

- `400`: orderId não fornecido
- `404`: Pedido não encontrado
- `400`: Pedido já pago (completed)
- `400`: Status inválido para cancelamento
- `500`: Erro interno do servidor

---

### 2. **Função de Cancelamento no Frontend**

**Arquivo:** `src/app/checkout/pix/page.tsx`

**Função:** `handleCancelOrder()`

```typescript
const handleCancelOrder = async () => {
  // Se não houver orderId, apenas voltar ao carrinho
  if (!orderId) {
    router.push('/carrinho');
    return;
  }

  try {
    console.log(`🚫 Cancelando pedido: ${orderId}`);

    const response = await fetch('/api/orders/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Pedido cancelado com sucesso');
      // Parar polling se estiver ativo
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
      // Voltar ao carrinho
      router.push('/carrinho');
    } else {
      console.error('❌ Erro ao cancelar pedido:', data.error);
      alert(`Erro ao cancelar pedido: ${data.error}`);
    }
  } catch (error) {
    console.error('❌ Erro ao cancelar pedido:', error);
    alert('Erro ao cancelar pedido. Tente novamente.');
  }
};
```

**Comportamento:**

1. **Sem orderId (novo checkout):**
   - Redireciona diretamente para o carrinho
   - Não chama a API (não há pedido para cancelar)

2. **Com orderId (retomando pagamento):**
   - Chama a API `/api/orders/cancel`
   - Para o polling de status (se ativo)
   - Exibe mensagens de erro caso falhe
   - Redireciona para o carrinho em caso de sucesso

3. **Integração com o botão:**

```tsx
<Button onClick={handleCancelOrder} variant='outline' className='w-full'>
  Cancelar e voltar ao carrinho
</Button>
```

---

## 🔒 Segurança e Validações

### **Backend (API)**

- ✅ Validação de existência do pedido
- ✅ Validação de status permitidos
- ✅ Proteção contra cancelamento de pedidos pagos
- ✅ Idempotência (múltiplos cancelamentos retornam sucesso)
- ✅ Tratamento de erros do Stripe
- ✅ Logs detalhados para auditoria

### **Frontend**

- ✅ Verificação se há orderId antes de chamar API
- ✅ Feedback visual para o usuário (alerts)
- ✅ Limpeza de recursos (polling interval)
- ✅ Tratamento de erros de rede
- ✅ Logs no console para debug

---

## 📊 Estados do Pedido

```
┌─────────┐
│ pending │ ──────────┐
└─────────┘           │
     │                │
     │ (webhook)      │ (cancelamento)
     │                │
     ▼                ▼
┌───────────┐   ┌───────────┐
│ completed │   │ cancelled │
└───────────┘   └───────────┘
```

**Regras:**

- `pending` → `completed`: Via webhook após pagamento confirmado
- `pending` → `cancelled`: Via botão "Cancelar e voltar ao carrinho"
- `completed`: **Estado final** (não pode ser cancelado)
- `cancelled`: **Estado final** (não pode ser revertido)

---

## 🧪 Como Testar

### **Cenário 1: Cancelar Novo Checkout**

1. Adicione produtos ao carrinho
2. Vá para checkout PIX
3. Clique em "Cancelar e voltar ao carrinho"
4. ✅ Deve voltar ao carrinho **sem** chamar API
5. ✅ Pedido **não** foi criado no banco

**Logs esperados:**

```
🚫 Cancelando pedido: (vazio)
// Redireciona sem chamar API
```

### **Cenário 2: Cancelar Pedido Pendente (Pagar Agora)**

1. Crie um pedido PIX e deixe pendente
2. Vá para "Meus Pedidos"
3. Clique em "💳 Pagar Agora"
4. Clique em "Cancelar e voltar ao carrinho"
5. ✅ Deve chamar API `/api/orders/cancel`
6. ✅ Deve cancelar Payment Intent no Stripe
7. ✅ Deve atualizar status para `cancelled` no DB
8. ✅ Deve parar o polling
9. ✅ Deve voltar ao carrinho

**Logs esperados (Console):**

```
🚫 Cancelando pedido: <orderId>
✅ Pedido cancelado com sucesso
```

**Logs esperados (Backend):**

```
🚫 Cancelando pedido: <orderId>
✅ Pedido encontrado: <orderId> - Status: pending
💳 Cancelando Payment Intent: pi_xxx
✅ Payment Intent cancelado com sucesso
✅ Pedido <orderId> cancelado com sucesso
```

### **Cenário 3: Tentar Cancelar Pedido Já Pago**

1. Crie um pedido PIX
2. Simule o pagamento (webhook confirma)
3. Tente acessar `/checkout/pix?orderId=<id>` e cancelar
4. ✅ API deve retornar erro 400
5. ✅ Alert deve exibir "Pedido já foi pago..."

**Logs esperados:**

```
🚫 Cancelando pedido: <orderId>
✅ Pedido encontrado: <orderId> - Status: completed
❌ Pedido <orderId> já foi pago, não pode ser cancelado
```

### **Cenário 4: Cancelamento Idempotente**

1. Cancele um pedido pendente
2. Tente cancelar novamente o mesmo pedido
3. ✅ Deve retornar sucesso sem erros
4. ✅ Status permanece `cancelled`

**Logs esperados:**

```
🚫 Cancelando pedido: <orderId>
✅ Pedido encontrado: <orderId> - Status: cancelled
⚠️ Pedido <orderId> já está cancelado
```

---

## 🔍 Verificação no Banco de Dados

### **Consulta SQL para verificar pedidos cancelados:**

```sql
SELECT
    id,
    status,
    total,
    email,
    "createdAt",
    "updatedAt",
    "stripePaymentIntentId"
FROM orders
WHERE status = 'cancelled'
ORDER BY "updatedAt" DESC
LIMIT 10;
```

### **Verificar Payment Intent no Stripe:**

Via CLI do Stripe:

```bash
stripe payment_intents retrieve pi_xxx
```

Status esperado:

```json
{
  "id": "pi_xxx",
  "status": "canceled",
  ...
}
```

---

## 📝 Observações Importantes

1. **Polling é parado:** Quando o usuário cancela, o polling de status do Payment Intent é interrompido para economizar requisições.

2. **Stripe pode falhar:** Se o cancelamento no Stripe falhar (ex: rede), o pedido **ainda assim** será cancelado no banco de dados. Isso garante consistência dos dados do e-commerce.

3. **Sem notificação por email:** Cancelamentos **não** enviam email para o cliente. Isso pode ser adicionado futuramente se necessário.

4. **Carrinho não é restaurado:** Os produtos **não** retornam ao carrinho após cancelamento. O usuário precisa adicionar novamente se quiser.

5. **URL com orderId permanece acessível:** Mesmo após cancelamento, a URL `/checkout/pix?orderId=xxx` ainda pode ser acessada, mas a API `resume-payment` vai retornar erro 400 ("Pedido cancelado não pode ser pago").

---

## 🚀 Melhorias Futuras

- [ ] Enviar email de confirmação de cancelamento
- [ ] Adicionar opção de restaurar itens ao carrinho
- [ ] Adicionar confirmação antes de cancelar ("Tem certeza?")
- [ ] Exibir motivo do cancelamento (usuário vs. sistema)
- [ ] Criar página de histórico de cancelamentos
- [ ] Adicionar analytics de taxa de cancelamento
- [ ] Implementar janela de tempo para auto-cancelamento (ex: 30 minutos)

---

## ✅ Checklist de Implementação

- [x] Criar API `/api/orders/cancel`
- [x] Validar status do pedido
- [x] Cancelar Payment Intent no Stripe
- [x] Atualizar banco de dados
- [x] Criar função `handleCancelOrder` no frontend
- [x] Conectar botão ao handler
- [x] Parar polling ao cancelar
- [x] Adicionar logs de debug
- [x] Tratamento de erros
- [x] Testar idempotência
- [x] Documentação completa
