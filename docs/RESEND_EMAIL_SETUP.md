# 📧 Configuração do Resend (Envio de E-mails)

## ✅ Recursos Implementados

1. **E-mail de Confirmação de Compra**
   - Template HTML profissional com React Email
   - Links de download com URLs assinadas (15min)
   - Cores da marca (#FED466, #FD9555)
   - Informações do pedido completas

2. **API de Download Seguro**
   - Geração de URLs temporárias do Cloudflare R2
   - Verificação de propriedade do usuário
   - Limite de downloads (preparado para 5x)
   - Logs de auditoria

3. **Webhook Stripe Atualizado**
   - Envio automático de e-mail após pagamento
   - Busca dados reais de produtos e variações
   - Geração de links de download
   - Tratamento de erros (não bloqueia webhook)

---

## 🚀 Setup do Resend (5 minutos)

### 1. Criar Conta no Resend

1. Acesse: https://resend.com/signup
2. Crie sua conta (gratuito - 100 e-mails/dia)
3. Faça login

### 2. Adicionar Domínio

#### Opção A: Domínio Próprio (Recomendado para produção)

1. No dashboard Resend, clique em **"Domains"**
2. Clique em **"Add Domain"**
3. Digite seu domínio: `a-rafa-criou.com`
4. Copie os registros DNS (MX, SPF, DKIM)
5. Adicione no seu provedor de DNS (Cloudflare, etc)
6. Aguarde verificação (~10 minutos)

**Registros DNS necessários:**
```
Tipo: MX
Nome: @
Valor: feedback-smtp.us-east-1.amazonses.com
Prioridade: 10

Tipo: TXT (SPF)
Nome: @
Valor: v=spf1 include:amazonses.com ~all

Tipo: TXT (DKIM)
Nome: resend._domainkey
Valor: [fornecido pelo Resend]
```

#### Opção B: Usar Domínio de Teste (Para desenvolvimento)

O Resend fornece automaticamente um domínio de teste:
- **De:** `onboarding@resend.dev`
- **Limitação:** Só envia para e-mails cadastrados no Resend
- **Vantagem:** Configuração instantânea

### 3. Obter API Key

1. No dashboard, vá em **"API Keys"**
2. Clique em **"Create API Key"**
3. Nome: `A Rafa Criou - Production`
4. Permissões: **"Sending access"**
5. Clique em **"Create"**
6. **Copie a chave** (só aparece 1 vez!)

Formato: `re_xxxxxxxxxxxxxxxxxxxxxxxxx`

### 4. Configurar Variável de Ambiente

Adicione ao `.env.local`:

```bash
# Resend (E-mail)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxx
```

**⚠️ Importante:**
- Nunca commite esta chave no Git
- Adicione ao `.env.local` (já está no `.gitignore`)

### 5. Reiniciar Next.js

```bash
# Ctrl+C no terminal do npm run dev
npm run dev
```

---

## 🧪 Testar Envio de E-mail

### Teste Completo (Payment Intent → Webhook → E-mail)

1. **Webhook Stripe rodando:**
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

2. **Next.js rodando:**
   ```bash
   npm run dev
   ```

3. **Fazer um pagamento de teste:**
   - Adicione produto ao carrinho
   - Vá para `/checkout`
   - Cartão: `4242 4242 4242 4242`
   - Preencha os dados
   - Finalize

4. **Verificar logs:**

   **Terminal Stripe CLI:**
   ```
   --> payment_intent.succeeded [evt_xxx]
   <-- [200] POST http://localhost:3000/api/stripe/webhook
   ```

   **Terminal Next.js:**
   ```
   ✅ Order created: 123e4567-e89b...
   📧 E-mail enviado para: seu@email.com
   ```

5. **Checar e-mail:**
   - Verifique sua caixa de entrada
   - Assunto: `✅ Pedido Confirmado #12...`
   - Deve conter links de download

---

## 📄 Template do E-mail

O template criado inclui:

✅ Logo da marca (no topo amarelo #FED466)  
✅ Título de confirmação  
✅ Informações do pedido (ID, data)  
✅ Lista de produtos com preços  
✅ **Botão de download para cada produto**  
✅ Total pago  
✅ Avisos importantes (validade 15min, limite 5x)  
✅ Botão "Ver Meus Pedidos"  
✅ Footer com contato  

**Exemplo visual:**

```
┌─────────────────────────────────────────────┐
│   [LOGO] A Rafa Criou (fundo amarelo)      │
├─────────────────────────────────────────────┤
│                                             │
│   ✅ Compra Confirmada!                     │
│                                             │
│   Olá, João Silva!                          │
│   Sua compra foi confirmada com sucesso.   │
│   Seus PDFs já estão disponíveis...        │
│                                             │
│   Pedido: #123e4567...   Data: 07/10/2025  │
│                                             │
│   📦 Seus Produtos                          │
│   ─────────────────────────────────────    │
│   Planilha Financeira - Versão Premium     │
│   R$ 29,90                                  │
│   [📥 Baixar PDF] (botão amarelo)          │
│   ─────────────────────────────────────    │
│                                             │
│   Total Pago: R$ 29,90                      │
│                                             │
│   ⚠️ Informações Importantes                │
│   • Links válidos por 15 minutos           │
│   • Até 5 downloads por produto            │
│   • Precisa baixar novamente? [link]       │
│                                             │
│   [Ver Meus Pedidos] (botão laranja)       │
│                                             │
│   Dúvidas? contato@a-rafa-criou.com        │
│   © 2025 A Rafa Criou                       │
└─────────────────────────────────────────────┘
```

---

## 🔐 Segurança Implementada

### URLs Assinadas do R2

✅ **TTL curto:** 15 minutos de validade  
✅ **Privacidade:** Arquivos nunca ficam públicos  
✅ **Únicas:** Cada link é gerado individualmente  
✅ **Expiração:** Após 15min, precisa solicitar novo link  

### Verificações na API `/api/download/generate-link`

✅ **Autenticação:** Usuário deve estar logado  
✅ **Propriedade:** Verifica se o pedido é do usuário  
✅ **Status:** Só permite download de pedidos confirmados  
✅ **Limite:** Preparado para limitar a 5 downloads (TODO: adicionar campo ao schema)  
✅ **Logs:** Registra cada download gerado  

---

## 📁 Arquivos Criados

```
src/
├── emails/
│   └── purchase-confirmation.tsx    # Template React Email
├── lib/
│   └── email.ts                      # Cliente Resend
└── app/api/
    ├── stripe/webhook/route.ts       # ATUALIZADO: envia e-mail
    └── download/generate-link/
        └── route.ts                  # Gera URLs assinadas
```

---

## 🐛 Troubleshooting

### E-mail não chegou?

1. **Verifique spam/lixeira**
2. **Confira logs do Next.js:** Deve mostrar `📧 E-mail enviado para: ...`
3. **Dashboard Resend:** Acesse "Logs" para ver status do envio
4. **Domínio verificado?** Se usar domínio próprio, verifique DNS

### Erro "RESEND_API_KEY not found"

1. Adicione ao `.env.local`:
   ```bash
   RESEND_API_KEY=re_sua_chave_aqui
   ```
2. Reinicie: `npm run dev`

### Links de download não funcionam?

1. **R2 configurado?** Verifique `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`
2. **Arquivo existe no R2?** Verifique tabela `files` no banco
3. **Link expirou?** URLs duram 15 minutos

---

## 📊 Limites do Resend

### Plano Gratuito (Free)

- ✅ **100 e-mails/dia**
- ✅ **1 domínio verificado**
- ✅ **API completa**
- ✅ **Logs de 7 dias**

### Plano Pago (se precisar)

- 🚀 **50.000 e-mails/mês** por $20
- 🚀 **Domínios ilimitados**
- 🚀 **Logs de 30 dias**
- 🚀 **Webhooks de eventos**

**Para começar:** Plano gratuito é suficiente!

---

## ✅ Próximas Etapas

Agora que o e-mail funciona, vamos criar:

1. ✅ **Página de histórico de pedidos** (`/conta/pedidos`)
2. ✅ **Re-download de PDFs** (gerar novos links)
3. 🔜 **Adicionar campo `downloadCount` ao schema**
4. 🔜 **Implementar limite de 5 downloads**
5. 🔜 **Watermark em PDFs** (opcional)

---

**Status:** 📧 E-mail implementado  
**Ação:** Configure RESEND_API_KEY e teste!  
**Tempo:** ~5 minutos
