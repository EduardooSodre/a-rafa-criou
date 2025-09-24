# 🚀 Projeto A Rafa Criou — Replatform WordPress → Next.js (App Router) + Drizzle + Auth.js

## ✅ Status de Implementação

### 0) Setup inicial ✅

- ✅ Next.js (App Router) + TS + Tailwind + Shadcn
- ✅ Drizzle + Postgres configurado
- ✅ Auth.js (Credentials + Email Provider)
- ⚠️ Providers: e-mail (precisa configurar Resend), **storage (falta Cloudflare R2)**, pagamentos (falta Stripe/PayPal/Pix)
- ⚠️ `.env` documentado (parcial)

### 1) Banco & Migrations ✅

- ✅ **Tabelas principais criadas**: `users`, `products`, `product_variations`, `files`, `orders`, `order_items`, `downloads`, `invites`, `url_map`
- ✅ **Cupons**: `coupons`, `coupon_products`, `coupon_variations`, `coupon_redemptions`
- ✅ **CMS**: `content_pages`, `content_blocks`, `content_versions`
- ✅ **Auth extra**: Estrutura para `password_reset_tokens`, `legacy_credentials`
- ❌ **Notificações**: `notifications`, `notification_settings` (faltam)
- ❌ **Afiliação**: `affiliates`, `affiliate_links`, `affiliate_commissions` (faltam)
- ❌ **Traduções**: `product_translations` (falta)

### 2) Migração WooCommerce ❌

- ❌ Scripts de import/export (clientes, pedidos, produtos, variações)
- ❌ Senhas: validar phpass → rehash moderno ou magic link
- ❌ Histórico de pedidos aparece no painel do cliente
- ❌ Admin pode mesclar contas em caso de e-mails diferentes
- ❌ Relatório de pendências para correções pré-go-live

### 3) Autenticação ⚠️

- ✅ Login moderno com Auth.js
- ✅ Estrutura para reset por token
- ⚠️ phpass → rehash automático (falta implementar)
- ⚠️ Magic link opcional (falta implementar)

### 4) CMS embutido ❌

- ❌ Editor TipTap/Editor.js, upload de imagens
- ❌ Preview e publicar com revalidate

### 5) Catálogo e PDP ⚠️

- ✅ `/produtos` e `/produtos/[slug]` estrutura criada
- ⚠️ Variações (estrutura no banco, falta implementar UI)
- ⚠️ SEO por produto/variação (falta implementar)

### 6) Checkout & Pagamentos ⚠️

- ✅ Estrutura `/checkout` criada
- ❌ Stripe (Payment Intent) + PayPal + Pix
- ❌ Webhooks idempotentes
- ❌ Campo cupom → validação backend → recalcular totais

### 7) Entrega do PDF ❌

- ❌ PDFs no **Cloudflare R2** (bucket privado)
- ❌ **URL assinada temporária** (TTL curto)
- ❌ E-mail + página de obrigado + área do cliente
- ❌ Aviso de direitos autorais antes do download

### 8) Cupons ❌

- ✅ Estrutura no banco criada
- ❌ CRUD no painel
- ❌ Validação backend
- ❌ Registro em `coupon_redemptions`

### 9) Notificações externas ❌

- ❌ E-mail admin
- ❌ Opcional: WhatsApp, SMS, Web Push
- ❌ Preferências + DND + logs

### 10) Afiliação ❌

- ❌ CRUD de afiliados, links e comissões
- ❌ Registro automático na compra via link
- ❌ Painel do afiliado com saldo/relatórios
- ❌ Rotina de pagamento de comissão (export/registro)

### 11) SEO & Redirecionamentos ❌

- ❌ Middleware 301 via `url_map`
- ❌ next-sitemap + robots.txt
- ❌ Canonical tags

### 12) Proteção de PDFs ❌

- ❌ Watermark dinâmica (e-mail + data)
- ❌ Limite de downloads configurável
- ❌ Logs em `downloads`
- ❌ Fingerprint invisível (metadata)

### 13) PWA (opcional) ❌

- ❌ Manifest + Service Worker
- ❌ Add to Home (iOS/Android)
- ❌ Push notifications

### 14) Cutover & Pós-go-live ❌

- ❌ Staging (`beta.`) para validação
- ❌ Trocar DNS + ativar 301
- ❌ Monitoramento 72h (erros, uptime, pedidos reais)
- ❌ Plano de rollback

---

## 🎯 **PRÓXIMOS PASSOS PRIORITÁRIOS**

### **FASE 1: Completar Fundações (1-2 semanas)**

1. **Configurar Storage Cloudflare R2** - Para uploads de PDFs
2. **Implementar sistema de pagamentos** - Stripe/PayPal/Pix básico
3. **Completar schemas do banco** - Notificações, Afiliação, Traduções
4. **Sistema de upload de arquivos** - Para produtos e variações

### **FASE 2: Funcionalidades Core (2-3 semanas)**

5. **CMS embutido básico** - Editor de conteúdo
6. **Cupons funcionais** - CRUD + validação no checkout
7. **Entrega automática de PDFs** - Webhook + e-mail + área cliente
8. **Área administrativa** - Gestão de produtos, pedidos, clientes

### **FASE 3: Recursos Avançados (2-3 semanas)**

9. **Sistema de notificações** - E-mail + canais opcionais
10. **Migração WooCommerce** - Scripts + validação
11. **Sistema de afiliação** - Links + comissões
12. **Proteção de PDFs** - Watermark + limites

### **FASE 4: SEO & Go-Live (1-2 semanas)**

13. **SEO + Redirecionamentos** - 301s + sitemap
14. **Testes finais** - Staging + validação
15. **Deploy produção** - DNS + monitoramento

---

## 🎨 Identidade Visual (UI Kit)

- **Background:** `#F4F4F4`
- **Cor primária:** `#FED466`
- **Cor secundária:** `#FD9555`
- **Componentes:** Tailwind + Shadcn UI
- **Foco:** Legibilidade e acessibilidade (público 25–70 anos)

---

## 🧭 Escopo Atual (implementação imediata)

- Loja de produtos digitais (PDF)
- Catálogo + páginas individuais (com **variações**)
- Checkout integrado (Pix, Cartão, Stripe, PayPal)
- **Cupons de desconto** editáveis pelo admin (percentual/fixo, limites, datas, escopo por produto/variação)
- Entrega automática pós-pagamento (e-mail + página de obrigado)
- Área do cliente (histórico + re-download + aviso de direitos autorais)
- Painel administrativo (produtos, variações, pedidos, cupons, clientes)
- Mobile-first + performance otimizada
- Backups e segurança
- Conversor de moeda (BRL/USD/EUR) + tradução de interface PT/EN
- Área de membros (convite via magic link)
- CMS embutido (editar textos e imagens sem programar)
- **Sistema de notificações externas** (E-mail, WhatsApp, SMS, Push)
- **Migração WordPress/WooCommerce** (clientes, pedidos, produtos, variações, 301)
- **Sistema de afiliação** (links de afiliados + comissões)
- **Tradução de PDFs (conteúdo)** — múltiplas versões por idioma
- **Infra/hospedagem** pronta para escala (deploy, monitoramento, backups, observabilidade)
- **Armazenamento de PDFs no Cloudflare R2 (S3-compat)**

---

## 🧱 Migração do WordPress/WooCommerce

- Exportar **clientes, pedidos e produtos** (incluindo **variações**) do WooCommerce
- Importar no Postgres (Drizzle) com mapeamento 1:1
- **Senhas (phpass)**: validar hash legado no primeiro login → rehash moderno; ou enviar magic link para redefinição
- **Histórico de pedidos** importado → aparece na área do cliente
- **Arquivos comprados anteriormente**: clientes continuam vendo e baixando os PDFs já adquiridos
- **URLs antigas**: aplicar redirecionamentos 301 para as novas rotas

### Experiência do cliente antigo

- Login com mesmo e-mail → pedidos antigos aparecem automaticamente
- Produtos adquiridos → botão **“Baixar novamente”** (gera link assinado temporário)
- Se e-mail antigo diferente → admin pode mesclar contas
- Todos os downloads são logados e protegidos

---

## 🔐 Autenticação (Auth.js + Drizzle)

- Providers: Credentials (email+senha) + Email (magic link)
- Recuperação de senha:
  - `password_reset_tokens` (hash, expiração, uso único)
  - Solicitação → e-mail com link seguro
  - Redefinição → nova senha com hash moderno
- Compatibilidade com hash legado do WordPress (phpass)

---

## 📰 CMS Embutido

- Editar textos/imagens (Home, Sobre, Contato, FAQ, banners)
- Pré-visualizar e publicar alterações
- Controle de versões para reverter conteúdo
- Permissões: admin publica; member edita rascunhos

---

## 🛒 Cupons de Desconto

- CRUD no admin (percentual/fixo, escopo por produto/variação, datas, limites)
- Aplicação no checkout com validação server-side
- Registro em `coupon_redemptions` para relatórios

---

## 🔔 Sistema de Notificações Externas

- **Canais suportados**:
  - E-mail (obrigatório)
  - WhatsApp (API Meta)
  - SMS (Twilio/Zenvia)
  - Web Push (OneSignal/FCM)
- **Configurações no painel**: toggles por canal, DND (não perturbe), templates editáveis
- **Fluxo**:
  1. Webhook de pagamento → cria registro em `notifications`
  2. Dispara nos canais habilitados
  3. Dashboard (se aberta) → toast + som
- **Banco**:
  - `notifications`: id, type (paid/failed), order_id, message, sent_channels
  - `notification_settings`: user_id, sound_enabled, email_enabled, whatsapp_enabled, sms_enabled, push_enabled, dnd_start, dnd_end

---

## 🤝 Sistema de Afiliados

- **Tabelas**
  - `affiliates`: id, user_id, comission_rate, created_at
  - `affiliate_links`: id, affiliate_id, product_id, code, clicks, created_at
  - `affiliate_commissions`: id, affiliate_id, order_id, amount, status (pending/paid)
- **Fluxo**
  - Afiliado gera link único
  - Cliente compra via link → registrar comissão
  - Admin aprova e libera pagamento
- **Painel do afiliado**
  - Links ativos, relatórios de vendas, saldo a receber

---

## 🌍 Tradução de PDFs (conteúdo)

- **Tabelas**
  - `product_translations`: id, product_id, lang, file_id, notes, created_at
- **Fluxo**
  - No admin, anexar PDF por idioma (ex.: PT/EN)
  - Na PDP, permitir seleção de idioma disponível
  - Na compra, gravar idioma escolhido no `order_item` (para métricas)

---

## ⚙️ Passo a Passo (para o Copilot)

### 0) Setup inicial

- Next.js (App Router) + TS + Tailwind + Shadcn
- Drizzle + Postgres
- Auth.js (Credentials + Email Provider)
- Providers: e-mail (Resend/Nodemailer), **storage (Cloudflare R2)**, pagamentos (Stripe/PayPal/Pix)
- `.env` documentado

### 1) Banco & Migrations

- Principais: `users`, `products`, `product_variations`, `files`, `orders`, `order_items`, `downloads`, `invites`, `url_map`
- Cupons: `coupons`, `coupon_products`, `coupon_variations`, `coupon_redemptions`
- CMS: `content_pages`, `content_blocks`, `content_versions`
- Auth extra: `password_reset_tokens`, `legacy_credentials`
- Notificações: `notifications`, `notification_settings`
- Afiliação: `affiliates`, `affiliate_links`, `affiliate_commissions`

### 2) Migração WooCommerce

- Scripts de import/export (clientes, pedidos, produtos, variações)
- Senhas: validar phpass → rehash moderno ou magic link
- Histórico de pedidos aparece no painel do cliente
- Admin pode mesclar contas em caso de e-mails diferentes
- Relatório de pendências para correções pré-go-live

### 3) Autenticação

- Login moderno + reset por token
- phpass → rehash automático
- Magic link opcional

### 4) CMS embutido

- Editor TipTap/Editor.js, upload de imagens
- Preview e publicar com revalidate

### 5) Catálogo e PDP

- `/produtos` e `/produtos/[slug]` com variações
- SEO por produto/variação
- Suporte a **traduções de PDFs** na PDP

### 6) Checkout & Pagamentos

- Stripe (Payment Intent) + PayPal + Pix
- Webhooks idempotentes
- Campo cupom → validação backend → recalcular totais

### 7) Entrega do PDF

- PDFs no **Cloudflare R2** (bucket privado)
- **URL assinada temporária** (TTL curto)
- E-mail + página de obrigado + área do cliente
- Aviso de direitos autorais antes do download

### 8) Cupons

- CRUD no painel
- Validação backend
- Registro em `coupon_redemptions`

### 9) Notificações externas

- E-mail admin
- Opcional: WhatsApp, SMS, Web Push
- Preferências + DND + logs

### 10) Afiliação

- CRUD de afiliados, links e comissões
- Registro automático na compra via link
- Painel do afiliado com saldo/relatórios
- Rotina de pagamento de comissão (export/registro)

### 11) SEO & Redirecionamentos

- Middleware 301 via `url_map`
- next-sitemap + robots.txt
- Canonical tags

### 12) Proteção de PDFs

- Watermark dinâmica (e-mail + data)
- Limite de downloads configurável
- Logs em `downloads`
- Fingerprint invisível (metadata)

### 13) PWA (opcional)

- Manifest + Service Worker
- Add to Home (iOS/Android)
- Push notifications

### 14) Cutover & Pós-go-live

- Staging (`beta.`) para validação
- Trocar DNS + ativar 301
- Monitoramento 72h (erros, uptime, pedidos reais)
- Plano de rollback

---

## ✅ Critérios de Aceite

- Clientes antigos conseguem logar e ver pedidos antigos
- Produtos comprados anteriormente podem ser baixados na nova área
- Compras novas entregues automaticamente (e-mail, obrigado, painel)
- Admin edita conteúdo via CMS e gerencia cupons/notificações/afiliação
- Notificações chegam por e-mail e canais extras opcionais
- SEO preservado via redirecionamentos
- Traduções de PDFs disponíveis e registradas no pedido
- Observabilidade e backups configurados

---

## 📦 Armazenamento de PDFs (Cloudflare R2)

- **Bucket privado** (ex.: `pdfs`)
- **Variáveis `.env` e `.env.local`**:
  ```bash
  R2_ACCOUNT_ID=xxxx
  R2_ACCESS_KEY_ID=xxxx
  R2_SECRET_ACCESS_KEY=xxxx
  R2_BUCKET=pdfs
  R2_REGION=auto
  ```
