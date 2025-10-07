# 🎯 SPRINT 1: Pagamentos e Entrega - Action Plan

## 📋 Overview

**Objetivo:** Implementar funcionalidade completa de vendas (pagamento → e-mail → download)

**Duração:** 2-3 semanas

**Status:** 🔴 Not Started

**Owner:** Dev Team

---

## 📅 Cronograma Detalhado

### Semana 1: Sistema de Pagamentos

**Dias 1-2: Setup Stripe**

- [ ] Criar conta Stripe (https://dashboard.stripe.com/register)
- [ ] Copiar chaves API (test mode):
  - Secret Key (sk*test*...)
  - Publishable Key (pk*test*...)
- [ ] Adicionar ao `.env.local`:
  ```env
  STRIPE_SECRET_KEY=sk_test_xxxxx
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
  STRIPE_WEBHOOK_SECRET=whsec_xxxxx
  ```
- [ ] Instalar SDK: `npm install stripe @stripe/stripe-js`

**Dias 3-4: Backend Stripe**

- [x] Criar `/src/lib/stripe.ts`:

  ```typescript
  import Stripe from 'stripe';

  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY não configurada no .env.local');
  }

  export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-08-27.basil', // Versão estável mais recente
    typescript: true,
  });
  ```

- [ ] Criar `/src/app/api/stripe/create-payment-intent/route.ts`:

  ```typescript
  import { stripe } from '@/lib/stripe';
  import { db } from '@/lib/db';

  export async function POST(req: Request) {
    const { items, userId } = await req.json();

    // 1. Validar produtos existem e pegar preços reais do banco
    const productIds = items.map(item => item.productId);
    const products = await db.select().from(products).where(inArray(products.id, productIds));

    // 2. Calcular total real (NUNCA confiar no frontend)
    let total = 0;
    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      total += product.price * item.quantity;
    }

    // 3. Criar Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100), // Converter R$ para centavos
      currency: 'brl',
      metadata: {
        userId,
        items: JSON.stringify(items),
      },
    });

    return Response.json({ clientSecret: paymentIntent.client_secret });
  }
  ```

**Dias 5-7: Frontend Stripe**

- [ ] Criar `/src/components/checkout/StripeForm.tsx`:

  ```typescript
  'use client';
  import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
  import { loadStripe } from '@stripe/stripe-js';

  const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

  function CheckoutForm() {
    const stripe = useStripe();
    const elements = useElements();

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!stripe || !elements) return;

      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/obrigado`,
        },
      });

      if (error) {
        console.error(error);
      }
    };

    return (
      <form onSubmit={handleSubmit}>
        <PaymentElement />
        <button type="submit" disabled={!stripe}>
          Pagar
        </button>
      </form>
    );
  }

  export default function StripeForm({ clientSecret }: { clientSecret: string }) {
    return (
      <Elements stripe={stripePromise} options={{ clientSecret }}>
        <CheckoutForm />
      </Elements>
    );
  }
  ```

- [ ] Atualizar `/src/app/checkout/page.tsx`:

  ```typescript
  'use client';
  import { useCart } from '@/contexts/cart-context';
  import StripeForm from '@/components/checkout/StripeForm';

  export default function CheckoutPage() {
    const { items } = useCart();
    const [clientSecret, setClientSecret] = useState('');

    useEffect(() => {
      fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, userId: session?.user?.id }),
      })
        .then(res => res.json())
        .then(data => setClientSecret(data.clientSecret));
    }, []);

    if (!clientSecret) return <div>Carregando...</div>;

    return <StripeForm clientSecret={clientSecret} />;
  }
  ```

**Teste Cartões:**

- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Requires Auth: `4000 0025 0000 3155`

---

### Semana 2: Webhooks e Criação de Pedidos

**Dias 1-3: Webhook Stripe**

- [ ] Instalar Stripe CLI: `stripe login`
- [ ] Forward webhooks local: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
- [ ] Copiar webhook secret (whsec\_...)
- [ ] Criar `/src/app/api/stripe/webhook/route.ts`:

  ```typescript
  import Stripe from 'stripe';
  import { stripe } from '@/lib/stripe';
  import { db } from '@/lib/db';
  import { orders, orderItems } from '@/lib/db/schema';

  export async function POST(req: Request) {
    const body = await req.text();
    const sig = req.headers.get('stripe-signature')!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
    } catch (err) {
      return Response.json({ error: 'Webhook signature verification failed' }, { status: 400 });
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      // Idempotência: verificar se pedido já existe
      const existingOrder = await db
        .select()
        .from(orders)
        .where(eq(orders.stripePaymentIntentId, paymentIntent.id))
        .limit(1);

      if (existingOrder.length > 0) {
        console.log('Order already created, skipping...');
        return Response.json({ received: true });
      }

      // Criar pedido
      const items = JSON.parse(paymentIntent.metadata.items);
      const userId = paymentIntent.metadata.userId;

      const [order] = await db
        .insert(orders)
        .values({
          userId,
          email: paymentIntent.receipt_email || '',
          status: 'completed',
          subtotal: paymentIntent.amount / 100,
          total: paymentIntent.amount / 100,
          paymentMethod: 'stripe',
          stripePaymentIntentId: paymentIntent.id,
        })
        .returning();

      // Criar itens do pedido
      for (const item of items) {
        await db.insert(orderItems).values({
          orderId: order.id,
          productId: item.productId,
          variationId: item.variationId || null,
          quantity: item.quantity,
          price: item.price,
        });
      }

      // TODO: Enviar e-mail de confirmação (próxima etapa)
      console.log('Order created:', order.id);
    }

    return Response.json({ received: true });
  }
  ```

- [ ] Adicionar campo `stripePaymentIntentId` na tabela `orders`:
  ```sql
  ALTER TABLE orders ADD COLUMN stripe_payment_intent_id VARCHAR(255) UNIQUE;
  ```

**Dias 4-5: Testes de Integração**

- [ ] Testar fluxo completo:
  1. Adicionar produtos ao carrinho
  2. Ir para checkout
  3. Preencher cartão teste
  4. Confirmar pagamento
  5. Verificar webhook recebido
  6. Verificar pedido criado no banco
  7. Verificar redirecionamento para `/obrigado`

- [ ] Rate limiting no webhook:

  ```typescript
  import rateLimit from 'express-rate-limit';

  const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 60, // 60 requisições
  });
  ```

**Dias 6-7: PayPal (opcional)**

- [ ] Criar conta PayPal Business
- [ ] Instalar SDK: `npm install @paypal/react-paypal-js`
- [ ] Criar `/src/app/api/paypal/create-order/route.ts`
- [ ] Adicionar botão PayPal no checkout
- [ ] Webhook de confirmação

---

### Semana 3: E-mail e Downloads

**Dias 1-2: Setup Resend**

- [ ] Criar conta Resend (https://resend.com/signup)
- [ ] Verificar domínio (adicionar DNS records)
- [ ] Copiar API key
- [ ] Adicionar ao `.env.local`:
  ```env
  RESEND_API_KEY=re_xxxxx
  RESEND_FROM_EMAIL=vendas@arafacriou.com.br
  ```
- [ ] Instalar SDK: `npm install resend react-email`

**Dias 3-4: Templates de E-mail**

- [ ] Criar `/src/email/purchase-confirmation.tsx`:

  ```typescript
  import { Html, Head, Body, Container, Heading, Text, Button, Link } from '@react-email/components';

  interface EmailProps {
    customerName: string;
    orderNumber: string;
    total: number;
    downloadLinks: Array<{ name: string; url: string }>;
  }

  export default function PurchaseConfirmation({ customerName, orderNumber, total, downloadLinks }: EmailProps) {
    return (
      <Html>
        <Head />
        <Body style={{ backgroundColor: '#F4F4F4' }}>
          <Container style={{ backgroundColor: '#fff', padding: '40px' }}>
            <Heading>Obrigado pela compra, {customerName}! 🎉</Heading>
            <Text>Seu pedido #{orderNumber} foi confirmado.</Text>
            <Text>Total: R$ {total.toFixed(2)}</Text>

            <Heading as="h2">Seus Downloads:</Heading>
            {downloadLinks.map(link => (
              <Button key={link.name} href={link.url} style={{ backgroundColor: '#FED466', color: '#000' }}>
                Baixar {link.name}
              </Button>
            ))}

            <Text>Você também pode acessar seus arquivos em:</Text>
            <Link href="https://arafacriou.com.br/conta/pedidos">Minha Conta</Link>
          </Container>
        </Body>
      </Html>
    );
  }
  ```

**Dias 5-6: API de E-mail**

- [ ] Criar `/src/lib/email/resend.ts`:

  ```typescript
  import { Resend } from 'resend';
  import PurchaseConfirmation from '@/email/purchase-confirmation';
  import { generateR2SignedUrl } from '@/lib/r2-utils';

  const resend = new Resend(process.env.RESEND_API_KEY);

  export async function sendPurchaseConfirmationEmail(order: Order, items: OrderItem[]) {
    // Gerar URLs assinadas para cada arquivo
    const downloadLinks = await Promise.all(
      items.map(async item => {
        const files = await db
          .select()
          .from(files)
          .where(
            item.variationId
              ? eq(files.variationId, item.variationId)
              : eq(files.productId, item.productId)
          );

        return Promise.all(
          files.map(async file => ({
            name: file.name,
            url: await generateR2SignedUrl(file.r2Key, 900), // 15 minutos
          }))
        );
      })
    ).then(links => links.flat());

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: order.email,
      subject: `✅ Pedido #${order.id.slice(0, 8)} confirmado!`,
      react: PurchaseConfirmation({
        customerName: order.user?.name || 'Cliente',
        orderNumber: order.id.slice(0, 8),
        total: order.total,
        downloadLinks,
      }),
    });
  }
  ```

- [ ] Integrar no webhook:

  ```typescript
  // No /api/stripe/webhook
  import { sendPurchaseConfirmationEmail } from '@/lib/email/resend';

  if (event.type === 'payment_intent.succeeded') {
    // ... criar pedido ...

    // Buscar itens do pedido
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));

    // Enviar e-mail
    await sendPurchaseConfirmationEmail(order, items);
  }
  ```

**Dia 7: Área do Cliente**

- [ ] Criar `/src/app/conta/pedidos/page.tsx`:

  ```typescript
  import { auth } from '@/lib/auth';
  import { db } from '@/lib/db';
  import { orders } from '@/lib/db/schema';

  export default async function MyOrdersPage() {
    const session = await auth();
    if (!session?.user) redirect('/auth/login');

    const userOrders = await db.select().from(orders)
      .where(eq(orders.userId, session.user.id))
      .orderBy(desc(orders.createdAt));

    return (
      <div>
        <h1>Meus Pedidos</h1>
        {userOrders.map(order => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>
    );
  }
  ```

- [ ] Criar `/src/components/OrderCard.tsx`:

  ```typescript
  'use client';
  import Link from 'next/link';

  export function OrderCard({ order }: { order: Order }) {
    return (
      <div className="border rounded p-4">
        <h3>Pedido #{order.id.slice(0, 8)}</h3>
        <p>Data: {new Date(order.createdAt).toLocaleDateString()}</p>
        <p>Total: R$ {order.total.toFixed(2)}</p>
        <p>Status: {order.status}</p>
        <Link href={`/conta/pedidos/${order.id}`}>
          Ver Detalhes
        </Link>
      </div>
    );
  }
  ```

- [ ] Criar `/src/app/conta/pedidos/[orderId]/page.tsx`:

  ```typescript
  import { generateR2SignedUrl } from '@/lib/r2-utils';

  export default async function OrderDetailPage({ params }: { params: { orderId: string } }) {
    const order = await db.select().from(orders).where(eq(orders.id, params.orderId)).limit(1);
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, params.orderId));

    // Buscar arquivos de cada item
    const itemsWithFiles = await Promise.all(
      items.map(async item => {
        const productFiles = await db.select().from(files)
          .where(item.variationId
            ? eq(files.variationId, item.variationId)
            : eq(files.productId, item.productId)
          );

        return { ...item, files: productFiles };
      })
    );

    return (
      <div>
        <h1>Pedido #{order[0].id.slice(0, 8)}</h1>
        {itemsWithFiles.map(item => (
          <div key={item.id}>
            <h3>{item.product.name}</h3>
            {item.files.map(file => (
              <DownloadButton key={file.id} file={file} orderId={params.orderId} />
            ))}
          </div>
        ))}
      </div>
    );
  }
  ```

- [ ] Criar `/src/components/DownloadButton.tsx`:

  ```typescript
  'use client';
  import { useState } from 'react';

  export function DownloadButton({ file, orderId }: { file: File; orderId: string }) {
    const [loading, setLoading] = useState(false);

    const handleDownload = async () => {
      setLoading(true);
      const res = await fetch('/api/download/generate-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId: file.id, orderId }),
      });
      const { url, error } = await res.json();

      if (error) {
        alert(error);
      } else {
        window.location.href = url;
      }
      setLoading(false);
    };

    return (
      <button onClick={handleDownload} disabled={loading}>
        {loading ? 'Gerando...' : `Baixar ${file.name}`}
      </button>
    );
  }
  ```

- [ ] Criar `/src/app/api/download/generate-link/route.ts`:

  ```typescript
  import { auth } from '@/lib/auth';
  import { generateR2SignedUrl } from '@/lib/r2-utils';
  import { db } from '@/lib/db';
  import { downloads, orders, files } from '@/lib/db/schema';

  const MAX_DOWNLOADS = 5;

  export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fileId, orderId } = await req.json();

    // 1. Verificar se usuário possui este pedido
    const order = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.userId, session.user.id)))
      .limit(1);

    if (order.length === 0) {
      return Response.json({ error: 'Pedido não encontrado' }, { status: 404 });
    }

    // 2. Verificar limite de downloads
    const downloadCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(downloads)
      .where(and(eq(downloads.userId, session.user.id), eq(downloads.fileId, fileId)));

    if (downloadCount[0].count >= MAX_DOWNLOADS) {
      return Response.json(
        { error: `Limite de ${MAX_DOWNLOADS} downloads atingido` },
        { status: 403 }
      );
    }

    // 3. Buscar arquivo
    const file = await db.select().from(files).where(eq(files.id, fileId)).limit(1);
    if (file.length === 0) {
      return Response.json({ error: 'Arquivo não encontrado' }, { status: 404 });
    }

    // 4. Gerar URL assinada (15 minutos)
    const signedUrl = await generateR2SignedUrl(file[0].r2Key, 900);

    // 5. Registrar download
    await db.insert(downloads).values({
      userId: session.user.id,
      orderId,
      fileId,
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
      userAgent: req.headers.get('user-agent') || 'unknown',
    });

    return Response.json({ url: signedUrl });
  }
  ```

---

## ✅ Checklist de Conclusão

### Pagamentos

- [ ] Stripe configurado (test + production)
- [ ] Payment Intent criado com valores corretos do banco
- [ ] Checkout aceita cartões teste
- [ ] Webhook recebe confirmação de pagamento
- [ ] Pedido criado no banco após pagamento
- [ ] Idempotência implementada (evita pedidos duplicados)
- [ ] Rate limiting em APIs

### E-mail

- [ ] Resend configurado
- [ ] Domínio verificado
- [ ] Template de e-mail criado
- [ ] E-mail enviado após pagamento
- [ ] URLs assinadas no e-mail (TTL 15min)
- [ ] E-mail chega na caixa de entrada (não spam)

### Downloads

- [ ] Área do cliente (`/conta/pedidos`)
- [ ] Lista de pedidos
- [ ] Detalhes do pedido
- [ ] Botão de download gera URL assinada
- [ ] Limite de downloads (5x)
- [ ] Logs registrados
- [ ] Rate limiting (1 download / 5s)

### Testes

- [ ] Fluxo completo funciona (carrinho → checkout → pagamento → e-mail → download)
- [ ] Cartão declinado mostra erro
- [ ] Webhook duplicado não cria pedido duplicado
- [ ] E-mail não chega após 5min → investigar
- [ ] Download funciona em navegadores diferentes
- [ ] Mobile responsivo

---

## 🚨 Riscos e Mitigações

### Risco 1: E-mail cai em spam

**Mitigação:**

- Verificar domínio no Resend (SPF, DKIM, DMARC)
- Não usar palavras spam ("grátis", "clique aqui")
- Testar com Gmail, Outlook, Yahoo

### Risco 2: URLs assinadas expiram antes do download

**Mitigação:**

- TTL de 15 minutos é suficiente
- Botão gera nova URL a cada clique
- Instruir cliente a baixar imediatamente

### Risco 3: Webhook não recebe confirmação

**Mitigação:**

- Stripe retenta automaticamente (exponential backoff)
- Logs no webhook para debug
- Endpoint deve retornar 200 rapidamente (< 5s)

### Risco 4: Limite de downloads muito baixo

**Mitigação:**

- Começar com 5 downloads
- Adicionar opção no admin para resetar
- Considerar aumentar para 10 em produtos caros

---

## 📊 Métricas de Sucesso

- [ ] Taxa de conversão no checkout > 80%
- [ ] 100% dos pedidos com e-mail entregue
- [ ] Tempo médio de entrega < 2 minutos
- [ ] 0 reclamações de "não recebi o produto"
- [ ] Taxa de abandono de carrinho < 20%

---

**Status:** 🔴 Aguardando início  
**Próxima revisão:** Após conclusão da Semana 1
