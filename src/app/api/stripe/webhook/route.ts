import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import { orders, orderItems, products, productVariations, files } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { resend, FROM_EMAIL } from '@/lib/email';
import { PurchaseConfirmationEmail } from '@/emails/purchase-confirmation';
import { render } from '@react-email/render';
import { getR2SignedUrl } from '@/lib/r2-utils';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return Response.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err);
    return Response.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }

  // Processar evento: payment_intent.succeeded
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    try {
      // IDEMPOTÊNCIA: Verificar se pedido já existe
      const existingOrder = await db
        .select()
        .from(orders)
        .where(eq(orders.stripePaymentIntentId, paymentIntent.id))
        .limit(1);

      if (existingOrder.length > 0) {
        return Response.json({ received: true });
      }

      // Parsear metadata
      const items = JSON.parse(paymentIntent.metadata.items || '[]');
      const userId = paymentIntent.metadata.userId || null;
      const customerEmail = paymentIntent.receipt_email || paymentIntent.metadata.customer_email || paymentIntent.metadata.email || '';
      const customerName = paymentIntent.metadata.customer_name || paymentIntent.metadata.userName || 'Cliente';

      // Criar pedido
      const [order] = await db
        .insert(orders)
        .values({
          userId,
          email: customerEmail,
          status: 'completed',
          subtotal: (paymentIntent.amount / 100).toString(),
          total: (paymentIntent.amount / 100).toString(),
          currency: paymentIntent.currency.toUpperCase(), // BRL, USD, etc
          paymentProvider: 'stripe',
          paymentId: paymentIntent.id,
          stripePaymentIntentId: paymentIntent.id,
          paymentStatus: 'paid',
          paidAt: new Date(),
        })
        .returning();

      // Criar itens do pedido com busca de produtos e variações
      const orderItemsData = [];
      for (const item of items) {
        // Buscar dados do produto e variação
        const [productData] = await db
          .select({
            productId: products.id,
            productName: products.name,
            variationId: productVariations.id,
            variationName: productVariations.name,
            price: productVariations.price,
          })
          .from(products)
          .leftJoin(productVariations, eq(productVariations.productId, products.id))
          .where(eq(products.id, item.productId))
          .limit(1);

        if (!productData || !productData.price) continue;

        const itemPrice = parseFloat(productData.price);
        const itemTotal = itemPrice * item.quantity;

        const [createdItem] = await db
          .insert(orderItems)
          .values({
            orderId: order.id,
            productId: item.productId,
            variationId: item.variationId || null,
            name: productData.productName || 'Produto',
            quantity: item.quantity,
            price: productData.price,
            total: itemTotal.toString(),
          })
          .returning();

        orderItemsData.push({
          id: createdItem.id,
          productName: productData.productName || 'Produto',
          variationName: productData.variationName || '',
          price: itemPrice,
          quantity: item.quantity,
          variationId: item.variationId,
        });
      }

      // 🚀 ENVIAR E-MAIL DE CONFIRMAÇÃO
      if (customerEmail) {
        try {
          // Gerar URLs assinadas para cada produto
          const productsWithDownloadUrls = await Promise.all(
            orderItemsData.map(async item => {
              // Buscar arquivo da variação
              const [fileData] = await db
                .select({
                  filePath: files.path,
                })
                .from(files)
                .where(eq(files.variationId, item.variationId))
                .limit(1);

              let downloadUrl = '';
              if (fileData?.filePath) {
                // Gerar URL assinada com 15 minutos de validade
                downloadUrl = await getR2SignedUrl(fileData.filePath, 15 * 60);
              }

              return {
                name: item.productName,
                variationName: item.variationName || undefined,
                price: item.price,
                downloadUrl,
              };
            })
          );

          // Renderizar e enviar e-mail
          const emailHtml = await render(
            PurchaseConfirmationEmail({
              customerName,
              orderId: order.id,
              orderDate: new Date().toLocaleDateString('pt-BR'),
              products: productsWithDownloadUrls,
              totalAmount: parseFloat(order.total),
            })
          );

          await resend.emails.send({
            from: FROM_EMAIL,
            to: customerEmail,
            subject: `✅ Pedido Confirmado #${order.id.slice(0, 8)} - A Rafa Criou`,
            html: emailHtml,
          });

        } catch {
          // Não bloquear o webhook se o e-mail falhar
        }
      }

      // TODO: Enviar e-mail de confirmação (próxima etapa - SPRINT 1.2)
    } catch {
      return Response.json({ error: 'Internal error' }, { status: 500 });
    }
  }

  return Response.json({ received: true });
}
