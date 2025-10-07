import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import { orders, orderItems } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return Response.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err);
    return Response.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
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
        console.log('⚠️ Order already exists, skipping:', paymentIntent.id);
        return Response.json({ received: true });
      }

      // Parsear metadata
      const items = JSON.parse(paymentIntent.metadata.items || '[]');
      const userId = paymentIntent.metadata.userId || null;

      // Criar pedido
      const [order] = await db
        .insert(orders)
        .values({
          userId,
          email: paymentIntent.receipt_email || '',
          status: 'completed',
          subtotal: (paymentIntent.amount / 100).toString(),
          total: (paymentIntent.amount / 100).toString(),
          paymentProvider: 'stripe',
          paymentId: paymentIntent.id,
          stripePaymentIntentId: paymentIntent.id,
          paymentStatus: 'paid',
          paidAt: new Date(),
        })
        .returning();

      // Criar itens do pedido
      for (const item of items) {
        const itemPrice = 0; // TODO: Buscar preço real do produto
        await db.insert(orderItems).values({
          orderId: order.id,
          productId: item.productId,
          variationId: item.variationId || null,
          name: 'Produto', // TODO: Buscar nome real
          quantity: item.quantity,
          price: itemPrice.toString(),
          total: (itemPrice * item.quantity).toString(),
        });
      }

      console.log('✅ Order created:', order.id);

      // TODO: Enviar e-mail de confirmação (próxima etapa - SPRINT 1.2)
    } catch (error) {
      console.error('❌ Error processing webhook:', error);
      return Response.json({ error: 'Internal error' }, { status: 500 });
    }
  }

  return Response.json({ received: true });
}
