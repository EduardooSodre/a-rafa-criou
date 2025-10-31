# 🚀 Como Testar o Pix AGORA

## Passo 1: Gerar um Pagamento Pix

1. Acesse seu site local: `http://localhost:3000`
2. Adicione um produto ao carrinho
3. Vá para o carrinho
4. Clique em **"Pagar com Pix"**
5. **IMPORTANTE:** Abra o console do navegador (F12) e anote o **Payment ID** que aparece nos logs

## Passo 2: Verificar o Payment ID

### Opção A: No próprio site (MAIS FÁCIL)

- O Payment ID aparece logo abaixo do QR Code
- Copie o ID para usar depois se necessário

### Opção B: No console do navegador

Você verá algo assim:

```
═══════════════════════════════════════════════════════
✅ PIX GERADO COM SUCESSO!
Payment ID: 1234567890
Para verificar manualmente:
node scripts/check-pix-payment.js 1234567890
═══════════════════════════════════════════════════════
```

## Passo 3: Pagar o Pix

### Se você tem Mercado Pago SANDBOX (teste):

1. Use o QR Code gerado
2. Pague com uma conta de teste
3. O webhook deve ser acionado automaticamente

### Se você está em PRODUÇÃO:

1. Pague o Pix normalmente
2. Aguarde alguns segundos

## Passo 4: Verificar se Funcionou

### Verificação Automática (recomendado):

Após pagar, clique no botão **"Já paguei, verificar agora"** que aparece na tela.

### Verificação Manual via Script:

```bash
# Substitua 1234567890 pelo seu Payment ID real
node scripts/check-pix-payment.js 1234567890
```

### Verificação via Navegador:

Acesse:

```
http://localhost:3000/api/mercado-pago/check-payment?paymentId=1234567890
```

## 🎯 O que Esperar

### Se tudo estiver funcionando:

✅ Status muda de `pending` para `completed`  
✅ Frontend redireciona para `/obrigado`  
✅ E-mail de confirmação é enviado  
✅ QR Code desaparece

### Se o webhook estiver funcionando:

Você verá nos logs do servidor:

```
═══════════════════════════════════════════════════════
[Webhook Pix] PAYLOAD COMPLETO RECEBIDO:
...
═══════════════════════════════════════════════════════
[Webhook] Status do pagamento: approved
[Webhook] Pedido xxx atualizado: pending -> completed
```

### Se o webhook NÃO estiver configurado:

- Não verá nada nos logs do servidor
- Use o botão "Já paguei, verificar agora"
- Ou use o script/endpoint de verificação manual

## 🆘 Problemas Comuns

### "Error 404" ao verificar pagamento:

❌ **Causa:** Você está usando "PAYMENT_ID" literal ao invés do ID real  
✅ **Solução:** Use o ID real que apareceu no console/tela

### QR Code não aparece:

❌ **Causa:** Erro ao gerar pagamento  
✅ **Solução:** Verifique o console do navegador para ver o erro

### Pagamento fica em "pending" para sempre:

❌ **Causa:** Webhook não configurado e você não clicou em "Já paguei"  
✅ **Solução:** Clique no botão "Já paguei, verificar agora"

## 📋 Checklist Rápido

Antes de testar, verifique:

- [ ] Servidor Next.js rodando (`npm run dev`)
- [ ] Arquivo `.env` tem `MERCADOPAGO_ACCESS_TOKEN`
- [ ] Arquivo `.env` tem `DATABASE_URL`
- [ ] Banco de dados está acessível
- [ ] Console do navegador aberto (F12) para ver logs

## 💡 Dica Pro

Mantenha **2 janelas** abertas:

1. **Navegador** - Para gerar e pagar o Pix
2. **Terminal** - Para ver os logs do servidor e webhook

Assim você consegue ver em tempo real se o webhook está sendo chamado!
