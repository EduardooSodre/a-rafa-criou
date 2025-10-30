import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import { orders } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');

    console.log(`🔄 Resume payment - orderId: ${orderId}`);

    if (!orderId) {
      return NextResponse.json({ error: 'orderId é obrigatório' }, { status: 400 });
    }

    // 1. 🔒 Buscar pedido e validar
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);

    if (!order) {
      console.log(`❌ Pedido ${orderId} não encontrado`);
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
    }

    console.log(
      `✅ Pedido encontrado: ${order.id} - Status: ${order.status} - Total: ${order.total}`
    );

    // 2. 🔒 Validar status do pedido
    if (order.status === 'completed') {
      console.log(`⚠️ Pedido ${orderId} já foi pago`);
      return NextResponse.json({ error: 'Pedido já foi pago' }, { status: 400 });
    }

    if (order.status === 'cancelled') {
      console.log(`⚠️ Pedido ${orderId} está cancelado`);
      return NextResponse.json({ error: 'Pedido cancelado não pode ser pago' }, { status: 400 });
    }

    if (order.status !== 'pending') {
      console.log(`⚠️ Pedido ${orderId} não está pendente (status: ${order.status})`);
      return NextResponse.json({ error: 'Pedido não está aguardando pagamento' }, { status: 400 });
    }

    // 3. 🔒 Validar Payment Intent
    if (!order.stripePaymentIntentId) {
      console.log(`❌ Pedido ${orderId} não tem Payment Intent`);
      return NextResponse.json(
        { error: 'Payment Intent não encontrado para este pedido' },
        { status: 400 }
      );
    }

    console.log(`💳 Recuperando Payment Intent: ${order.stripePaymentIntentId}`);

    // 4. Buscar Payment Intent no Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(order.stripePaymentIntentId);

    console.log(`💳 Payment Intent status: ${paymentIntent.status}`);

    // 5. 🔒 Validar que Payment Intent ainda está válido
    if (paymentIntent.status === 'succeeded') {
      console.log(`⚠️ Payment Intent já foi confirmado`);
      // Webhook ainda não processou, mas pagamento foi feito
      return NextResponse.json(
        {
          error: 'Pagamento já foi confirmado, aguardando processamento',
          shouldRefresh: true,
        },
        { status: 400 }
      );
    }

    if (paymentIntent.status === 'canceled') {
      console.log(`⚠️ Payment Intent foi cancelado`);
      return NextResponse.json({ error: 'Payment Intent foi cancelado' }, { status: 400 });
    }

    // 6. ✅ Retornar dados do Payment Intent
    console.log(`✅ Retornando dados do Payment Intent para o cliente`);

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      amount: parseFloat(order.total),
      paymentIntentId: paymentIntent.id,
      orderId: order.id,
      email: order.email,
    });
  } catch (error) {
    console.error('❌ Erro ao retomar pagamento:', error);
    return NextResponse.json({ error: 'Erro ao retomar pagamento' }, { status: 500 });
  }
}
