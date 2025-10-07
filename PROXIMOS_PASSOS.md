# 🚀 Próximos Passos - A Rafa Criou

## 📊 Status Atual do Projeto (Atualizado: Janeiro 2025)

### ✅ O que está COMPLETO (100%)

1. **Fundação Técnica**
   - Next.js 15 + TypeScript + Tailwind + Shadcn UI
   - PostgreSQL + Drizzle ORM
   - Auth.js (login/registro)
   - ESLint + Prettier

2. **Banco de Dados**
   - Schema completo (produtos, pedidos, cupons, CMS)
   - Migrações aplicadas
   - Relacionamentos configurados

3. **Painel Admin**
   - Dashboard com estatísticas
   - CRUD de produtos (✅ 100% otimizado)
   - CRUD de categorias
   - CRUD de usuários
   - Upload de imagens (Cloudinary CDN)
   - Upload de PDFs (Cloudflare R2)
   - **Performance: 88% mais rápida** (N+1 queries resolvido)

4. **Cloudinary (CDN de Imagens)**
   - Migração completa de base64 → Cloudinary
   - Upload otimizado (1200x1200, WebP/AVIF auto)
   - Cleanup automático (delete ao editar/deletar)
   - Edge caching global
   - 25GB grátis/mês

5. **Cloudflare R2 (Storage de PDFs)**
   - Upload/download de arquivos
   - URLs assinadas (TTL configurável)
   - Delete de arquivos

---

## 🎯 ROADMAP PRIORIZADO

### 🔥 **SPRINT 1: Pagamentos e Entrega** (2-3 semanas) - CRÍTICO

**Objetivo:** Sistema completo de compra e entrega de PDFs

#### 1.1 Sistema de Pagamentos

**Prioridade: P0 (BLOQUEADOR)**

- [ ] **Stripe Integration**
  - [ ] Criar conta Stripe (https://stripe.com)
  - [ ] Adicionar chaves ao `.env` (`STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`)
  - [ ] Criar `/api/stripe/create-payment-intent`
    - Recebe: items, total, userId
    - Retorna: clientSecret (para frontend)
  - [ ] Criar `/api/stripe/webhook`
    - Validar assinatura Stripe
    - Evento `payment_intent.succeeded` → criar pedido
    - Idempotência (verificar `metadata.orderId`)
    - Rate limiting (60 req/min)
  - [ ] Frontend: Stripe Elements no checkout
    - Formulário de cartão
    - Processar pagamento
    - Redirecionar para `/obrigado`

- [ ] **PayPal Integration**
  - [ ] Criar conta PayPal Business
  - [ ] SDK `@paypal/react-paypal-js`
  - [ ] Botão PayPal no checkout
  - [ ] Webhook para confirmação
  - [ ] Idempotência

- [ ] **PIX (via Stripe)**
  - [ ] Gerar QR Code PIX
  - [ ] Polling de status (5s interval)
  - [ ] Expiração automática (15 min)
  - [ ] Cancelar se expirado

- [ ] **Criar Pedido no Banco**
  - [ ] Inserir em `orders` table
    ```sql
    INSERT INTO orders (userId, email, status, subtotal, discount, total, paymentMethod)
    VALUES (?, ?, 'completed', ?, ?, ?, ?)
    ```
  - [ ] Inserir em `order_items` table
    ```sql
    INSERT INTO order_items (orderId, productId, variationId, quantity, price)
    VALUES (?, ?, ?, ?, ?)
    ```
  - [ ] Atualizar contadores (vendas do produto)

**Arquivos a criar:**

- `src/app/api/stripe/create-payment-intent/route.ts`
- `src/app/api/stripe/webhook/route.ts`
- `src/app/api/paypal/create-order/route.ts`
- `src/app/api/paypal/webhook/route.ts`
- `src/app/checkout/page.tsx` (atualizar com Stripe Elements)

---

#### 1.2 Entrega Automática de PDFs

**Prioridade: P0 (BLOQUEADOR)**

- [ ] **Integração Resend (E-mail)**
  - [ ] Criar conta Resend (https://resend.com) - **100 e-mails/dia grátis**
  - [ ] Adicionar `RESEND_API_KEY` ao `.env`
  - [ ] Instalar: `npm install resend`
  - [ ] Criar templates de e-mail:
    - `email/purchase-confirmation.tsx` (React Email)
    - `email/download-ready.tsx`
    - `email/order-confirmation.tsx`
  - [ ] API `/api/email/send-download-link`

    ```typescript
    import { Resend } from 'resend';
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: 'vendas@arafacriou.com.br',
      to: customer.email,
      subject: '✅ Seu pedido está pronto!',
      react: DownloadReadyEmail({ order, downloadLinks }),
    });
    ```

  - [ ] Chamar API após pagamento aprovado (webhook)

- [ ] **Área do Cliente (`/conta`)**
  - [ ] Criar `/conta/pedidos` page
  - [ ] API `/api/orders/my-orders`
    - Buscar pedidos do usuário logado
    - Retornar com itens e arquivos
  - [ ] Componente `OrderCard.tsx`
    - Número do pedido
    - Data
    - Status (pendente/concluído/cancelado)
    - Total
    - Botão "Ver Detalhes"
  - [ ] Página `/conta/pedidos/[orderId]`
    - Detalhes completos
    - **Botões de Download** (gerar URL assinada R2)
    - Contador de downloads (máx 3-5 vezes)
  - [ ] API `/api/download/generate-link`
    ```typescript
    // Verificar:
    // 1. Usuário possui este pedido
    // 2. Pedido está completo
    // 3. Limite de downloads não atingido
    // 4. Gerar URL assinada R2 (TTL 15min)
    // 5. Registrar em downloads table
    ```

- [ ] **Sistema de Downloads**
  - [ ] Tabela `downloads` já criada
  - [ ] Registrar cada download:
    ```sql
    INSERT INTO downloads (userId, orderId, fileId, ipAddress, userAgent)
    VALUES (?, ?, ?, ?, ?)
    ```
  - [ ] Contador de downloads:

    ```typescript
    const downloadCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(downloads)
      .where(and(eq(downloads.userId, userId), eq(downloads.fileId, fileId)));

    if (downloadCount[0].count >= MAX_DOWNLOADS) {
      return { error: 'Limite de downloads atingido' };
    }
    ```

  - [ ] Rate limiting (1 download a cada 5 segundos)

**Arquivos a criar:**

- `src/lib/email/resend.ts`
- `src/email/purchase-confirmation.tsx`
- `src/email/download-ready.tsx`
- `src/app/api/email/send-download-link/route.ts`
- `src/app/conta/pedidos/page.tsx`
- `src/app/conta/pedidos/[orderId]/page.tsx`
- `src/app/api/orders/my-orders/route.ts`
- `src/app/api/download/generate-link/route.ts`
- `src/components/OrderCard.tsx`

---

#### 1.3 Sistema de Cupons

**Prioridade: P1 (ALTA)**

- [ ] **CRUD Admin**
  - [ ] Criar `/admin/cupons` page
  - [ ] Componente `CouponForm.tsx`
    - Code (único, UPPERCASE)
    - Tipo (percentage, fixed_amount)
    - Valor (0-100% ou R$)
    - Data início/fim
    - Limite de uso (total e por cliente)
    - Produtos/categorias específicas (opcional)
  - [ ] API `/api/admin/coupons` (POST, GET, PUT, DELETE)
  - [ ] Listagem de cupons com busca

- [ ] **Validação no Checkout**
  - [ ] Input de cupom no checkout
  - [ ] API `/api/coupons/validate`
    ```typescript
    // Verificar:
    // 1. Cupom existe e está ativo
    // 2. Dentro da validade (start_date <= now <= end_date)
    // 3. Não atingiu limite de uso
    // 4. Cliente não atingiu limite individual
    // 5. Produtos do carrinho são elegíveis
    // Retornar: { valid, discount, message }
    ```
  - [ ] Recalcular total com desconto
    ```typescript
    const discount = coupon.type === 'percentage' ? (subtotal * coupon.value) / 100 : coupon.value;
    const total = subtotal - discount;
    ```
  - [ ] Feedback visual (cupom aplicado/inválido)

- [ ] **Registro de Uso**
  - [ ] Inserir em `coupon_redemptions` após compra
    ```sql
    INSERT INTO coupon_redemptions (couponId, userId, orderId, discountAmount)
    VALUES (?, ?, ?, ?)
    ```
  - [ ] Incrementar contador de uso no cupom

**Arquivos a criar:**

- `src/app/admin/cupons/page.tsx`
- `src/components/admin/CouponForm.tsx`
- `src/app/api/admin/coupons/route.ts`
- `src/app/api/coupons/validate/route.ts`
- `src/components/checkout/CouponInput.tsx`

---

### 🎨 **SPRINT 2: UX e Catálogo** (1-2 semanas)

**Objetivo:** Melhorar experiência de compra

#### 2.1 Frontend do Catálogo

- [ ] Página `/produtos` completa
  - [ ] Grid responsivo (2/3/4 colunas)
  - [ ] ProductCard com imagem Cloudinary
  - [ ] Busca por nome/descrição
  - [ ] Filtros (categoria, preço min/max, tags)
  - [ ] Ordenação (preço ↑↓, nome A-Z, popularidade, mais recentes)
  - [ ] Paginação ou infinite scroll
  - [ ] Skeleton loaders

#### 2.2 Página de Produto (PDP)

- [ ] Galeria de Imagens
  - [ ] Lightbox com zoom
  - [ ] Thumbnails clicáveis
  - [ ] Lazy loading
  - [ ] Cloudinary transformations (`f_auto,q_auto`)

- [ ] Seletor de Variações
  - [ ] Dropdown ou grid de atributos
  - [ ] Atualizar preço ao selecionar
  - [ ] Validar todos atributos selecionados
  - [ ] Botão "Adicionar ao Carrinho" desabilitado se incompleto

- [ ] SEO Dinâmico
  - [ ] Meta title: `{produto.name} | A Rafa Criou`
  - [ ] Meta description: `{produto.shortDescription}`
  - [ ] Open Graph (og:image, og:title, og:description)
  - [ ] JSON-LD Schema.org:
    ```json
    {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": "...",
      "image": "...",
      "offers": {
        "@type": "Offer",
        "price": "...",
        "priceCurrency": "BRL"
      }
    }
    ```

- [ ] Breadcrumbs
  - [ ] `Home > {categoria} > {produto}`
  - [ ] JSON-LD BreadcrumbList

- [ ] Produtos Relacionados
  - [ ] Mesma categoria
  - [ ] Limite 4-6 produtos

**Arquivos a atualizar:**

- `src/app/produtos/page.tsx`
- `src/app/produtos/[slug]/page.tsx`
- `src/components/product-card.tsx`
- `src/components/ProductGallery.tsx` (criar)
- `src/components/VariationSelector.tsx` (criar)

---

### 🔍 **SPRINT 3: SEO** (1 semana)

- [ ] Sitemap Automático
  - [ ] Instalar `next-sitemap`
  - [ ] Configurar `next-sitemap.config.js`
  - [ ] Incluir produtos, categorias, páginas estáticas

- [ ] robots.txt

  ```
  User-agent: *
  Allow: /
  Disallow: /admin
  Sitemap: https://arafacriou.com.br/sitemap.xml
  ```

- [ ] Middleware de Redirecionamentos 301
  - [ ] Ler `url_map` table no middleware
  - [ ] Aplicar redirect se existe
  - [ ] Admin para gerenciar redirecionamentos

- [ ] Canonical tags em todas páginas
- [ ] Open Graph completo
- [ ] JSON-LD em todas páginas

---

### 🔄 **SPRINT 4: Migração WooCommerce** (2-3 semanas)

#### 4.1 Scripts de Exportação (WooCommerce)

- [ ] Script PHP/Node para exportar:
  - [ ] Produtos (WP REST API `/wp-json/wc/v3/products`)
  - [ ] Clientes (`/wp-json/wc/v3/customers`)
  - [ ] Pedidos (`/wp-json/wc/v3/orders`)
  - [ ] Salvar em JSON/CSV

#### 4.2 Scripts de Importação

- [ ] Script Node `scripts/import-woocommerce.ts`
  - [ ] Ler JSON/CSV
  - [ ] Importar produtos e variações
  - [ ] Importar clientes (validar senhas phpass)
  - [ ] Importar histórico de pedidos
  - [ ] Logs de progresso

#### 4.3 Admin Tools

- [ ] Interface para mesclar contas
- [ ] Relatório de pendências

---

### 🚀 **SPRINT 5: Deploy** (1 semana)

- [ ] Configurar Vercel
  - [ ] Conectar GitHub repo
  - [ ] Variáveis de ambiente
  - [ ] Domínio customizado

- [ ] CI/CD (GitHub Actions)
  - [ ] Lint + Type Check
  - [ ] Deploy automático (main branch)

- [ ] Monitoramento
  - [ ] Sentry para errors
  - [ ] Google Analytics

- [ ] Go-Live
  - [ ] Trocar DNS
  - [ ] Monitorar 72h

---

## 📦 Recursos OPCIONAIS (Backlog)

### Notificações Avançadas

- WhatsApp (Meta API)
- SMS (Twilio)
- Web Push (OneSignal)

### Afiliação

- CRUD de afiliados
- Links únicos (UTM tracking)
- Painel do afiliado

### CMS Embutido

- Editor TipTap
- Upload de imagens
- Versionamento

### Proteção de PDFs

- Watermark dinâmica
- Fingerprint invisível

### i18n Completo

- Traduções completas PT/EN/ES
- Seletor de idioma
- Conversor de moeda

### PWA

- Manifest
- Service Worker
- Add to Home

---

## 🎯 Métricas de Sucesso

### Performance

- ✅ Admin list: **< 300ms** (antes: 2000ms) - ATINGIDO
- ✅ Product GET: **< 250ms** (antes: 1500ms) - ATINGIDO
- 🎯 Checkout: < 2s (incluindo pagamento)
- 🎯 Home page: < 1s

### Negócio

- 🎯 100% dos pedidos com e-mail de download
- 🎯 < 1% de carrinho abandonado no checkout
- 🎯 0 reclamações de download (links sempre válidos)
- 🎯 99.9% uptime

---

**Última atualização:** Janeiro 2025
**Status:** Sprint 1 (Pagamentos) - Ready to Start
