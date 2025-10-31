import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const paymentId = searchParams.get('paymentId');
  if (!paymentId) {
    return NextResponse.json({ error: 'paymentId obrigatório' }, { status: 400 });
  }

  const [order] = await db.select().from(orders).where(eq(orders.paymentId, paymentId)).limit(1);
  if (!order) {
    return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
  }

  // ✅ Se ainda estiver pending, consultar Mercado Pago para ver se já foi aprovado
  if (order.status === 'pending' && order.paymentProvider === 'pix') {
    try {
      const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
        },
      });

      if (paymentResponse.ok) {
        const payment = await paymentResponse.json();

        // Se foi aprovado no Mercado Pago, atualizar banco
        if (['approved', 'paid', 'authorized'].includes(payment.status)) {
          await db
            .update(orders)
            .set({
              status: 'completed',
              paymentStatus: 'paid',
              updatedAt: new Date(),
              paidAt: new Date(),
            })
            .where(eq(orders.id, order.id));

          console.log(`[Status Polling] ✅ Pagamento aprovado! Atualizando pedido ${order.id}`);

          // Enviar e-mail de confirmação
          try {
            await fetch(`${process.env.NEXTAUTH_URL}/api/orders/send-confirmation`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderId: order.id }),
            });
          } catch (emailError) {
            console.error('[Status Polling] Erro ao enviar e-mail:', emailError);
          }

          return NextResponse.json({ status: 'completed' });
        }
      }
    } catch (error) {
      console.error('[Status Polling] Erro ao consultar Mercado Pago:', error);
    }
  }

  return NextResponse.json({ status: order.status });
}
