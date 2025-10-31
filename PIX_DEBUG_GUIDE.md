# Guia de Debugging - Webhook Pix Mercado Pago

## ✅ Correções Implementadas

### 1. Webhook Aprimorado
- Aceita TODOS os formatos de payload do Mercado Pago
- Logs detalhados para debugging
- Extrai payment ID de 3 formatos diferentes
- Sempre consulta a API do Mercado Pago para status real

### 2. Endpoint de Teste Criado
- `/api/mercado-pago/check-payment?paymentId=XXX`
- Verifica status no Mercado Pago e no banco
- Atualiza o banco se necessário
- Envia e-mail de confirmação se pago

## 🧪 Como Testar

### Passo 1: Fazer um Pagamento Pix
1. Acesse o carrinho
2. Clique em "Pagar com Pix"
3. Anote o `payment_id` que aparece no console do navegador
4. Faça o pagamento do Pix

### Passo 2: Verificar os Logs
Abra o terminal onde o Next.js está rodando e procure por:
```
[Webhook Pix] PAYLOAD COMPLETO RECEBIDO:
```

Se NÃO aparecer nada, o webhook NÃO está sendo chamado pelo Mercado Pago.

### Passo 3: Verificar Status Manualmente
Acesse no navegador:
```
http://localhost:3000/api/mercado-pago/check-payment?paymentId=SEU_PAYMENT_ID
```

Isso vai mostrar:
- Status no Mercado Pago
- Status no banco de dados
- Se foi atualizado automaticamente

### Passo 4: Forçar Atualização (se necessário)
Se o webhook não funcionar, você pode:
1. Usar o endpoint de verificação acima (ele atualiza automaticamente)
2. O frontend também consulta a cada 4 segundos

## 🔍 Debugging

### Se o webhook não está sendo chamado:

1. **Verificar URL do Webhook no Mercado Pago**
   - Acesse: https://www.mercadopago.com.br/developers/panel
   - Vá em: Aplicação > Webhooks
   - URL deve ser: `https://SEU_DOMINIO/api/mercado-pago/webhook`
   - Para desenvolvimento local, use ngrok ou similar

2. **Usar ngrok para testes locais:**
   ```bash
   ngrok http 3000
   ```
   - Copie a URL gerada (ex: https://abc123.ngrok.io)
   - Configure no Mercado Pago: https://abc123.ngrok.io/api/mercado-pago/webhook

3. **Verificar logs do ngrok:**
   - Acesse: http://localhost:4040
   - Veja todas as requisições recebidas

### Se o pagamento está aprovado mas não atualiza:

1. **Use o endpoint de verificação:**
   ```
   GET /api/mercado-pago/check-payment?paymentId=XXX
   ```

2. **Verifique o payment ID:**
   - Abra o console do navegador
   - Procure por: `payment_id` na resposta da API

3. **Consulte diretamente no Mercado Pago:**
   - Acesse: https://www.mercadopago.com.br/activities
   - Veja o status do pagamento

## 📋 Checklist de Troubleshooting

- [ ] Webhook está configurado no painel do Mercado Pago?
- [ ] URL do webhook está correta?
- [ ] Webhook está recebendo requisições? (verificar logs)
- [ ] Payment ID está correto?
- [ ] ACCESS_TOKEN do Mercado Pago está configurado no .env?
- [ ] Ordem foi criada no banco com o payment_id correto?
- [ ] Frontend está consultando o status a cada 4 segundos?

## 🆘 Solução de Emergência

Se nada funcionar, execute manualmente:

```javascript
// No console do navegador, após fazer o pagamento:
const paymentId = "SEU_PAYMENT_ID_AQUI";
const response = await fetch(`/api/mercado-pago/check-payment?paymentId=${paymentId}`);
const data = await response.json();
console.log(data);
```

Isso vai forçar a verificação e atualização do status.

## 📝 Logs Importantes

### Webhook recebendo corretamente:
```
═══════════════════════════════════════════════════════
[Webhook Pix] PAYLOAD COMPLETO RECEBIDO:
{
  "type": "payment",
  "data": {
    "id": "123456789"
  }
}
═══════════════════════════════════════════════════════
[Webhook Pix] 🔍 Payment ID extraído: 123456789
[Webhook] Consultando pagamento 123456789 no Mercado Pago...
[Webhook] Status do pagamento 123456789: approved
[Webhook] Pedido xxx atualizado: pending -> completed (MP status: approved)
```

### Webhook NÃO configurado:
```
(Nada aparece nos logs quando você faz o pagamento)
```

Neste caso, use o endpoint de verificação manual.
