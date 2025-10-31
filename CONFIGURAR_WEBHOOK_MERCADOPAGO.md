# 🔧 Configurar Webhook do Mercado Pago - Passo a Passo

## ⚠️ PROBLEMA ATUAL

Você está recebendo o pagamento Pix no Mercado Pago, mas o banco de dados não atualiza porque:
**O WEBHOOK NÃO ESTÁ CONFIGURADO!**

## 📋 Como Configurar o Webhook

### Passo 1: Acessar o Painel do Mercado Pago

1. Acesse: https://www.mercadopago.com.br/developers/panel
2. Faça login com sua conta
3. Selecione sua aplicação (ou crie uma se não tiver)

### Passo 2: Configurar Webhooks

1. No menu lateral, clique em **"Webhooks"** ou **"Notificações"**
2. Clique em **"Configurar Webhooks"** ou **"Nova notificação"**

### Passo 3: Configurar a URL

#### Para PRODUÇÃO:

```
https://SEU_DOMINIO.com/api/mercado-pago/webhook
```

#### Para DESENVOLVIMENTO LOCAL (usando ngrok):

**No terminal 1:**

```bash
npm run dev
```

**No terminal 2:**

```bash
ngrok http 3000
```

Você verá algo assim:

```
Session Status                online
Forwarding                    https://abc123.ngrok.io -> http://localhost:3000
```

**Use esta URL no Mercado Pago:**

```
https://abc123.ngrok.io/api/mercado-pago/webhook
```

### Passo 4: Selecionar Eventos

Marque a opção:

- ✅ **Pagamentos** (ou "Payments")

### Passo 5: Copiar a Assinatura Secreta

Após salvar, o Mercado Pago vai mostrar uma **Assinatura Secreta (Secret)**.

**IMPORTANTE:** Copie essa chave e adicione no seu `.env`:

```env
MERCADOPAGO_WEBHOOK_SECRET=sua_assinatura_secreta_aqui
```

### Passo 6: Salvar

Clique em **"Salvar"** ou **"Criar"**

## 🧪 Como Testar se o Webhook Funciona

### Teste 1: Fazer um Pagamento Pix

1. Gere um novo Pix no seu site
2. Anote o **Payment ID** que aparece no console
3. Pague o Pix
4. **IMPORTANTE:** Mantenha o terminal do servidor aberto

### Teste 2: Ver os Logs

Se o webhook funcionar, você verá:

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
[Webhook] Pedido xxx atualizado: pending -> completed
```

Se **NÃO** aparecer nada, o webhook **NÃO** está configurado corretamente!

## 🆘 Solução Alternativa (Enquanto Webhook Não Funciona)

### Opção A: Usar o Botão "Já Paguei"

1. Após pagar o Pix, clique no botão **"Já paguei, verificar agora"**
2. O sistema vai verificar manualmente e atualizar

### Opção B: Usar o Endpoint Manualmente

Após o pagamento, acesse:

```
http://localhost:3000/api/mercado-pago/check-payment?paymentId=SEU_PAYMENT_ID
```

### Opção C: Usar o Script

```bash
node scripts/check-pix-payment.js SEU_PAYMENT_ID
```

## 📝 Checklist de Troubleshooting

- [ ] Webhook configurado no painel do Mercado Pago?
- [ ] URL do webhook está correta?
- [ ] Para local: ngrok está rodando?
- [ ] Para local: URL do ngrok foi copiada corretamente?
- [ ] Evento "Pagamentos" está marcado?
- [ ] ACCESS_TOKEN do Mercado Pago está no .env?
- [ ] Servidor Next.js está rodando?

## 🔍 Verificar se o Webhook Foi Configurado

1. Acesse: https://www.mercadopago.com.br/developers/panel
2. Vá em Webhooks
3. Você deve ver sua URL listada
4. Status deve estar "Ativo" ou "Active"

## ⚙️ Variáveis de Ambiente Necessárias

No arquivo `.env`:

```env
# Access Token (das credenciais da sua aplicação)
MERCADOPAGO_ACCESS_TOKEN=seu_token_aqui

# Webhook Secret (fornecido ao configurar o webhook)
MERCADOPAGO_WEBHOOK_SECRET=sua_assinatura_secreta_aqui

# URLs
NEXTAUTH_URL=http://localhost:3000  # ou sua URL de produção

# Database
DATABASE_URL=sua_connection_string
```

### 🔐 Para que serve cada chave:

- **MERCADOPAGO_ACCESS_TOKEN**: Para fazer chamadas à API (criar pagamentos, consultar status)
- **MERCADOPAGO_WEBHOOK_SECRET**: Para validar que os webhooks realmente vieram do Mercado Pago (segurança)

## 🎯 Como Saber se Está Funcionando

### ✅ Funcionando:

- Logs aparecem no terminal após pagamento
- Status muda de `pending` para `completed` automaticamente
- Frontend redireciona para `/obrigado`
- E-mail de confirmação é enviado

### ❌ NÃO Funcionando:

- Nenhum log aparece no terminal
- Status fica `pending` para sempre
- Precisa clicar em "Já paguei" manualmente
- Não recebe e-mail

## 📚 Links Úteis

- Painel Mercado Pago: https://www.mercadopago.com.br/developers/panel
- Documentação Webhooks: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
- Download ngrok: https://ngrok.com/download

---

**IMPORTANTE:** Se você está em desenvolvimento local, o webhook **SÓ** funcionará com ngrok ou similar, pois o Mercado Pago precisa de uma URL pública para enviar as notificações!
