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

  try {
    console.log(`[Check Payment] Verificando pagamento ${paymentId}...`);

    // Buscar no Mercado Pago
    const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
      },
    });

    if (!paymentResponse.ok) {
      throw new Error(`Erro ao buscar pagamento: ${paymentResponse.status}`);
    }

    const payment = await paymentResponse.json();
    console.log(`[Check Payment] Status do Mercado Pago:`, payment.status);

    // Buscar pedido no banco
    const [order] = await db.select().from(orders).where(eq(orders.paymentId, paymentId)).limit(1);

    if (!order) {
      return NextResponse.json(
        {
          error: 'Pedido não encontrado no banco',
          mercadoPagoStatus: payment.status,
          mercadoPagoData: payment,
        },
        { status: 404 }
      );
    }

    // Atualizar se necessário
    let updated = false;
    let newStatus = 'pending';
    let paymentStatus = 'pending';

    // ✅ USAR MESMA LÓGICA DO WEBHOOK (IGUAL À STRIPE)
    if (['approved', 'paid', 'authorized'].includes(payment.status)) {
      newStatus = 'completed';
      paymentStatus = 'paid'; // ✅ IGUAL À STRIPE
    } else if (['pending', 'in_process', 'in_mediation'].includes(payment.status)) {
      newStatus = 'pending';
      paymentStatus = 'pending';
    } else if (['cancelled', 'rejected', 'expired', 'charged_back'].includes(payment.status)) {
      newStatus = 'cancelled';
      paymentStatus = 'cancelled';
    } else if (payment.status === 'refunded') {
      newStatus = 'refunded';
      paymentStatus = 'refunded';
    }

    if (newStatus !== order.status) {
      console.log(
        `[Check Payment] Atualizando pedido ${order.id}: ${order.status} -> ${newStatus}`
      );

      await db
        .update(orders)
        .set({
          status: newStatus,
          paymentStatus: paymentStatus, // ✅ AGORA USA 'paid' em vez de 'approved'
          updatedAt: new Date(),
          paidAt: newStatus === 'completed' ? new Date() : order.paidAt,
        })
        .where(eq(orders.id, order.id));

      updated = true;

      // Enviar e-mail de confirmação se completado
      if (newStatus === 'completed') {
        try {
          await fetch(`${process.env.NEXTAUTH_URL}/api/orders/send-confirmation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: order.id }),
          });
          console.log(`[Check Payment] E-mail de confirmação enviado`);
        } catch (emailError) {
          console.error('[Check Payment] Erro ao enviar e-mail:', emailError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      updated,
      mercadoPago: {
        id: payment.id,
        status: payment.status,
        status_detail: payment.status_detail,
        transaction_amount: payment.transaction_amount,
        date_approved: payment.date_approved,
      },
      database: {
        orderId: order.id,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paidAt: order.paidAt,
      },
    });
  } catch (error) {
    console.error('[Check Payment] Erro:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
