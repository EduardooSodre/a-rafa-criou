# 🚀 A Rafa Criou - E-commerce de PDFs

E-commer- ❌ **Notificações**: `notifications`, `notification_settings` (FALTA)
- ❌ **Afiliação**: `affiliates`, `affiliate_links`, `affiliate_commissions` (FALTA)moderno para venda de produtos digitais (PDFs) com foco em acessibilidade, migração do WooCommerce e experiência otimizada para público 25-70 anos.

---

## 🎨 Identidade Visual

- **Background:** `#F4F4F4`
- **Cor Primária:** `#FED466` (Amarelo)
- **Cor Secundária:** `#FD9555` (Laranja)
- **Tipografia:** Poppins ≥16px (acessibilidade AA)
- **Componentes:** Tailwind CSS + Shadcn UI

---

## 🛠️ Stack Tecnológica

- **Framework:** Next.js 15 (App Router)
- **Linguagem:** TypeScript
- **Estilização:** Tailwind CSS + Shadcn UI
- **Banco de Dados:** PostgreSQL + Drizzle ORM
- **Autenticação:** Auth.js (NextAuth v5)
- **Storage:** Cloudflare R2 (S3-compatible)
- **Pagamentos:** Stripe + PayPal + PIX (em desenvolvimento)
- **E-mail:** Resend (em desenvolvimento)
- **Validação:** Zod

---

## ✅ Status de Implementação

### 🟢 **1. FUNDAÇÃO** (COMPLETO)
- ✅ Next.js 15 + TypeScript + Tailwind configurado
- ✅ Shadcn UI com cores customizadas (#FED466, #FD9555, #F4F4F4)
- ✅ Drizzle ORM + PostgreSQL funcionando
- ✅ Auth.js configurado (Credentials + Magic Link)
- ✅ ESLint + Prettier
- ✅ Variáveis de ambiente documentadas (`.env.example`)

### 🟢 **2. BANCO DE DADOS** (COMPLETO)
- ✅ **Auth:** `users`, `accounts`, `sessions`, `verification_tokens`
- ✅ **Produtos:** `products`, `product_variations`, `product_images`, `files`, `categories`
- ✅ **Atributos:** `attributes`, `attribute_values`, `product_attributes`, `variation_attribute_values`
- ✅ **Pedidos:** `orders`, `order_items`, `downloads`
- ✅ **Cupons:** `coupons`, `coupon_products`, `coupon_variations`, `coupon_redemptions`
- ✅ **CMS:** `content_pages`, `content_blocks`, `content_versions`
- ✅ **Outros:** `invites`, `url_map`
- ❌ **Notificações:** `notifications`, `notification_settings` (FALTA)
- ❌ **Afiliação:** `affiliates`, `affiliate_links`, `affiliate_commissions` (FALTA)
- ❌ **Traduções:** `product_translations` (FALTA)

### � **3. AUTENTICAÇÃO** (PARCIAL - 60%)
- ✅ Auth.js configurado e funcional
- ✅ Login com Credentials (email + senha)
- ✅ Registro de usuários
- ✅ Roles (admin, member, customer)
- ✅ Estrutura para reset de senha (`password_reset_tokens`)
- ❌ Recuperação de senha funcional (FALTA)
- ❌ Magic Link funcional (FALTA)
- ❌ Compatibilidade phpass para migração WooCommerce (FALTA)
- ❌ Rehash automático de senhas legadas (FALTA)

### 🟢 **4. PAINEL ADMINISTRATIVO** (COMPLETO)
- ✅ Layout admin (`/admin`)
- ✅ Dashboard com estatísticas
- ✅ **Produtos:**
  - ✅ Listagem com busca, filtros e paginação
  - ✅ CRUD completo (criar, editar, excluir)
  - ✅ Upload de imagens (base64)
  - ✅ Upload de PDFs para Cloudflare R2
  - ✅ Variações de produtos
  - ✅ Atributos personalizados
  - ✅ SEO por produto
- ✅ **Categorias:**
  - ✅ CRUD completo
  - ✅ Ordenação e ativação
- ✅ **Usuários:**
  - ✅ Listagem
  - ✅ Promoção/demoção de admins
  - ✅ Confirmação por senha
- ❌ **Cupons:** Interface admin (FALTA)
- ❌ **Pedidos:** Gestão de pedidos (FALTA)
- ❌ **Relatórios:** Analytics e vendas (FALTA)

### 🟡 **5. CATÁLOGO E PRODUTOS** (PARCIAL - 40%)
- ✅ Estrutura `/produtos` criada
- ✅ Estrutura `/produtos/[slug]` criada
- ✅ API de produtos funcionando
- ✅ Hook `useProducts` para buscar produtos
- ❌ UI do catálogo completa (FALTA)
- ❌ Filtros e busca no frontend (FALTA)
- ❌ Seletor de variações na PDP (FALTA)
- ❌ Galeria de imagens na PDP (FALTA)
- ❌ SEO dinâmico por produto (FALTA)
- ❌ Breadcrumbs e navegação (FALTA)

### 🟡 **6. CARRINHO E CHECKOUT** (PARCIAL - 30%)
- ✅ Context API para carrinho
- ✅ localStorage para persistência
- ✅ Página `/carrinho`
- ✅ Página `/checkout` com formulário
- ✅ Simulação de processamento
- ✅ Página `/obrigado` (confirmação)
- ❌ Gateway de pagamento real (Stripe/PayPal/PIX) (FALTA)
- ❌ Webhooks idempotentes (FALTA)
- ❌ Validação de cupons no checkout (FALTA)
- ❌ Recalcular totais com desconto (FALTA)
- ❌ Criar pedido no banco (FALTA)

### 🟡 **7. CLOUDFLARE R2 (Storage)** (PARCIAL - 70%)
- ✅ Configuração R2 (variáveis `.env`)
- ✅ Upload de PDFs (`/api/r2/upload`)
- ✅ Delete de arquivos (`/api/r2/delete`)
- ✅ URLs assinadas para download (`/api/r2/download`)
- ✅ Integração com admin de produtos
- ❌ Entrega automática pós-pagamento (FALTA)
- ❌ E-mail com link de download (FALTA)
- ❌ Área do cliente com downloads (FALTA)
- ❌ Proteção: watermark, limite de downloads, logs (FALTA)

### 🔴 **8. SISTEMA DE CUPONS** (NÃO INICIADO - 0%)
- ✅ Estrutura no banco criada
- ❌ CRUD no painel admin (FALTA)
- ❌ Validação backend no checkout (FALTA)
- ❌ Aplicar desconto e recalcular totais (FALTA)
- ❌ Registro em `coupon_redemptions` (FALTA)
- ❌ Limites de uso e datas (FALTA)

### 🔴 **9. CMS EMBUTIDO** (NÃO INICIADO - 0%)
- ✅ Estrutura no banco criada
- ❌ Editor (TipTap/Editor.js) (FALTA)
- ❌ Upload de imagens (FALTA)
- ❌ Preview de conteúdo (FALTA)
- ❌ Publicar e revalidate (FALTA)
- ❌ Versionamento de conteúdo (FALTA)

### 🔴 **10. NOTIFICAÇÕES EXTERNAS** (NÃO INICIADO - 0%)
- ❌ Tabelas `notifications`, `notification_settings` (FALTA)
- ❌ E-mail transacional (Resend) (FALTA)
- ❌ WhatsApp (API Meta) opcional (FALTA)
- ❌ SMS (Twilio/Zenvia) opcional (FALTA)
- ❌ Web Push (OneSignal/FCM) opcional (FALTA)
- ❌ Preferências de notificação (FALTA)
- ❌ DND (Não Perturbe) (FALTA)

### 🔴 **11. SISTEMA DE AFILIAÇÃO** (NÃO INICIADO - 0%)
- ❌ Tabelas `affiliates`, `affiliate_links`, `affiliate_commissions` (FALTA)
- ❌ CRUD de afiliados (FALTA)
- ❌ Geração de links únicos (FALTA)
- ❌ Registro de comissões (FALTA)
- ❌ Painel do afiliado (FALTA)
- ❌ Rotina de pagamento (FALTA)

### 🔴 **12. MIGRAÇÃO WOOCOMMERCE** (NÃO INICIADO - 0%)
- ❌ Scripts de export (WooCommerce → JSON/CSV) (FALTA)
- ❌ Scripts de import (JSON/CSV → PostgreSQL) (FALTA)
- ❌ Validação de senhas phpass (FALTA)
- ❌ Rehash automático no login (FALTA)
- ❌ Importar histórico de pedidos (FALTA)
- ❌ Admin mesclar contas (FALTA)
- ❌ Relatório de pendências (FALTA)

### 🔴 **13. SEO E REDIRECIONAMENTOS** (NÃO INICIADO - 0%)
- ❌ Middleware 301 via `url_map` (FALTA)
- ❌ next-sitemap (FALTA)
- ❌ robots.txt (FALTA)
- ❌ Canonical tags (FALTA)
- ❌ Open Graph tags (FALTA)
- ❌ Schema.org (JSON-LD) (FALTA)

### 🔴 **14. PROTEÇÃO DE PDFs** (NÃO INICIADO - 0%)
- ❌ Watermark dinâmica (e-mail + data) (FALTA)
- ❌ Limite de downloads por cliente (FALTA)
- ❌ Logs detalhados em `downloads` (FALTA)
- ❌ Fingerprint invisível (metadata) (FALTA)

### � **15. i18n (Interface)** (PARCIAL - 50%)
- ✅ react-i18next configurado
- ✅ Middleware de detecção de idioma
- ✅ Arquivos de tradução PT/EN/ES criados
- ✅ Hook `useTranslation` em uso
- ✅ Cookies e localStorage para persistência
- ❌ Seletor de idioma na interface (FALTA)
- ❌ Tradução de todas as páginas (FALTA)
- ❌ Conversor de moeda (BRL/USD/EUR) (FALTA)

### 🔴 **16. PWA** (NÃO INICIADO - 0%)
- ❌ Manifest (FALTA)
- ❌ Service Worker (FALTA)
- ❌ Add to Home (iOS/Android) (FALTA)
- ❌ Push Notifications (FALTA)

### 🔴 **17. TESTES E QUALIDADE** (NÃO INICIADO - 0%)
- ❌ Jest (unit tests) (FALTA)
- ❌ Cypress (e2e tests) (FALTA)
- ❌ Testes de integração (FALTA)
- ❌ Coverage reports (FALTA)

### 🔴 **18. DEPLOY E INFRA** (NÃO INICIADO - 0%)
- ❌ Vercel/Netlify configurado (FALTA)
- ❌ CI/CD (GitHub Actions) (FALTA)
- ❌ Staging (`beta.`) (FALTA)
- ❌ Monitoramento (Sentry/LogRocket) (FALTA)
- ❌ Backups automatizados (FALTA)
- ❌ Rate limiting (FALTA)

---

## 🎯 PRÓXIMOS PASSOS (Prioridade)

### **FASE 1: Completar Funcionalidades Core** (2-3 semanas)

#### 1.1 Sistema de Pagamentos (CRÍTICO)
- [ ] Integrar Stripe (Payment Intent)
- [ ] Integrar PayPal
- [ ] Integrar PIX
- [ ] Criar pedido no banco após pagamento
- [ ] Webhooks idempotentes com validação

#### 1.2 Entrega de PDFs (CRÍTICO)
- [ ] E-mail transacional (Resend)
- [ ] Enviar link de download pós-pagamento
- [ ] Área do cliente (`/conta`) com histórico
- [ ] Re-download com limite configurável
- [ ] Logs de download em `downloads`

#### 1.3 Sistema de Cupons (IMPORTANTE)
- [ ] CRUD no admin
- [ ] Validação no checkout
- [ ] Recalcular totais com desconto
- [ ] Registro em `coupon_redemptions`

---

### **FASE 2: Catálogo e UX** (2 semanas)

#### 2.1 Frontend do Catálogo
- [ ] UI completa `/produtos`
- [ ] Busca e filtros funcionais
- [ ] Paginação
- [ ] Ordenação (preço, nome, popularidade)

#### 2.2 Página de Produto (PDP)
- [ ] Galeria de imagens
- [ ] Seletor de variações
- [ ] SEO dinâmico (title, description, OG)
- [ ] Breadcrumbs

---

### **FASE 3: Migração WooCommerce** (2-3 semanas)

#### 3.1 Scripts de Migração
- [ ] Export WooCommerce → JSON/CSV
- [ ] Import JSON/CSV → PostgreSQL
- [ ] Validar e rehash senhas phpass
- [ ] Importar pedidos antigos

#### 3.2 Admin Tools
- [ ] Mesclar contas duplicadas
- [ ] Relatório de pendências
- [ ] Testar login de clientes migrados

---

### **FASE 4: Recursos Avançados** (3-4 semanas)

#### 4.1 Notificações
- [ ] Criar tabelas faltantes
- [ ] E-mail admin (novo pedido)
- [ ] WhatsApp/SMS/Push (opcionais)
- [ ] Preferências e DND

#### 4.2 Afiliação
- [ ] Criar tabelas faltantes
- [ ] CRUD de afiliados
- [ ] Links únicos e comissões
- [ ] Painel do afiliado

#### 4.3 CMS Embutido
- [ ] Editor TipTap
- [ ] Upload de imagens
- [ ] Preview e publicar

#### 4.4 Proteção de PDFs
- [ ] Watermark dinâmica
- [ ] Limite de downloads
- [ ] Fingerprint invisível

---

### **FASE 5: SEO e i18n** (2 semanas)

- [ ] Middleware 301 (`url_map`)
- [ ] next-sitemap + robots.txt
- [ ] Completar traduções PT/EN/ES (interface)
- [ ] Seletor de idioma na UI
- [ ] Conversor de moeda (BRL/USD/EUR)

---

### **FASE 6: PWA e Testes** (2 semanas)

- [ ] PWA (manifest + service worker)
- [ ] Jest (unit tests)
- [ ] Cypress (e2e)
- [ ] Coverage > 70%

---

### **FASE 7: Deploy e Go-Live** (1-2 semanas)

- [ ] Configurar Vercel/Netlify
- [ ] CI/CD (GitHub Actions)
- [ ] Staging (`beta.`)
- [ ] Monitoramento (Sentry)
- [ ] Trocar DNS
- [ ] Monitoramento 72h
- [ ] Plano de rollback

---

## 🚀 Quick Start

### 1. Instalação
```bash
git clone <repository-url>
cd a-rafa-criou
npm install
```

### 2. Configuração do Ambiente
```bash
cp .env.example .env.local
# Configure as variáveis necessárias no .env.local
```

### 3. Banco de Dados
```bash
# Configure seu PostgreSQL e atualize DATABASE_URL no .env.local
npm run db:generate      # Gerar migrations
npm run db:migrate       # Executar migrations
npm run db:studio        # (Opcional) Drizzle Studio
```

### 4. Desenvolvimento
```bash
npm run dev              # Servidor de desenvolvimento
```
Acesse [http://localhost:3000](http://localhost:3000)

---

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Servidor de desenvolvimento
npm run build            # Build de produção
npm run start            # Servidor de produção

# Qualidade de código
npm run lint             # ESLint
npm run lint:fix         # ESLint com correção automática
npm run format           # Prettier
npm run format:check     # Verificar formatação
npm run type-check       # Verificação TypeScript

# Banco de dados
npm run db:generate      # Gerar migrations
npm run db:migrate       # Executar migrations
npm run db:studio        # Drizzle Studio
npm run db:push          # Push schema direto (dev)
```

---

## 📁 Estrutura do Projeto

```
src/
├── app/                    # App Router (Next.js 15)
│   ├── api/               # API Routes
│   │   ├── admin/         # APIs admin (produtos, usuários, stats)
│   │   ├── auth/          # Auth.js
│   │   ├── products/      # API pública de produtos
│   │   ├── r2/            # Upload/download Cloudflare R2
│   │   └── download/      # URLs assinadas
│   ├── admin/             # Painel administrativo
│   │   ├── produtos/      # Gestão de produtos
│   │   └── usuarios/      # Gestão de usuários
│   ├── auth/              # Páginas de autenticação
│   ├── produtos/          # Catálogo e PDPs
│   ├── carrinho/          # Carrinho de compras
│   ├── checkout/          # Checkout
│   ├── conta/             # Área do cliente
│   └── obrigado/          # Confirmação pós-compra
├── components/            # Componentes React
│   ├── admin/             # Componentes admin
│   ├── header/            # Header e navegação
│   ├── sections/          # Seções reutilizáveis
│   └── ui/                # Componentes Shadcn UI
├── contexts/              # React Context (carrinho, etc)
├── hooks/                 # Custom hooks
├── lib/                   # Utilitários e configurações
│   ├── auth/              # Configuração Auth.js
│   ├── db/                # Drizzle ORM e schemas
│   ├── utils/             # Funções utilitárias
│   ├── r2.ts              # Cliente Cloudflare R2
│   └── r2-utils.ts        # Helpers R2
├── locales/               # Traduções (futuro)
└── types/                 # Definições TypeScript
```

---

## 🔐 Segurança

### Variáveis Sensíveis
Todas as variáveis sensíveis estão em `.env.example`. **Nunca commite `.env.local`**.

### Rate Limiting (Planejado)
- Login: 5 tentativas/minuto
- Downloads: Configurável por usuário
- APIs: 60 requests/minuto

### Proteção de PDFs (Planejado)
- URLs assinadas (TTL 15 min)
- Watermark dinâmica
- Limite de re-downloads
- Logs completos

---

## 🌍 Localização (Planejado)

### Moedas
- BRL (Real) - Padrão
- USD (Dólar)
- EUR (Euro)

### Idiomas (Interface)
- PT (Português) - Padrão
- EN (Inglês)
- ES (Espanhol)

**Nota:** Traduções de PDFs (conteúdo) não serão implementadas - equipe própria de tradução.

---

## 📊 Monitoramento (Planejado)

- Google Analytics
- Sentry (Error Tracking)
- Hotjar (UX)

---

## 📄 Licença

Projeto proprietário - A Rafa Criou

---

## 📞 Suporte

Para questões técnicas, entre em contato pelos canais oficiais.

---

**Desenvolvido com ❤️ para A Rafa Criou**
