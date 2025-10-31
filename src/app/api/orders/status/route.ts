import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const paymentId = searchParams.get('paymentId');
  const orderId = searchParams.get('orderId');
  
  if (!paymentId && !orderId) {
    return NextResponse.json({ error: 'paymentId ou orderId obrigatório' }, { status: 400 });
  }

  // Buscar pedido por paymentId ou orderId
  let order;
  if (orderId) {
    const [foundOrder] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    order = foundOrder;
  } else if (paymentId) {
    const [foundOrder] = await db.select().from(orders).where(eq(orders.paymentId, paymentId)).limit(1);
    order = foundOrder;
  }

  if (!order) {
    return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
  }

  console.log('[Status Polling] 🔍 Verificando pedido:', {
    orderId: order.id,
    paymentId: order.paymentId,
    status: order.status,
    paymentProvider: order.paymentProvider,
    paymentStatus: order.paymentStatus
  });

  // ✅ Se ainda estiver pending, consultar Mercado Pago para ver se já foi aprovado
  if (order.status === 'pending' && (order.paymentProvider === 'pix' || order.paymentProvider === 'mercado_pago')) {
    if (!order.paymentId) {
      console.log('[Status Polling] ⚠️ Pedido sem paymentId, não é possível verificar');
      return NextResponse.json({ 
        status: order.status, 
        paymentStatus: order.paymentStatus 
      });
    }

    try {
      console.log('[Status Polling] 🔄 Consultando Mercado Pago para payment:', order.paymentId);
      
      const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${order.paymentId}`, {
        headers: {
          Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
        },
      });

      if (paymentResponse.ok) {
        const payment = await paymentResponse.json();
        
        console.log('[Status Polling] 📊 Status no Mercado Pago:', {
          status: payment.status,
          statusDetail: payment.status_detail
        });

        // Se foi aprovado no Mercado Pago, atualizar banco
        if (['approved', 'paid', 'authorized'].includes(payment.status)) {
          console.log('[Status Polling] ✅ Pagamento aprovado! Atualizando pedido', order.id);
          
          await db
            .update(orders)
            .set({
              status: 'completed',
              paymentStatus: 'paid',
              updatedAt: new Date(),
              paidAt: new Date(),
            })
            .where(eq(orders.id, order.id));

          // Enviar e-mail de confirmação
          try {
            await fetch(`${process.env.NEXTAUTH_URL}/api/orders/send-confirmation`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderId: order.id }),
            });
            console.log('[Status Polling] 📧 E-mail de confirmação enviado');
          } catch (emailError) {
            console.error('[Status Polling] ❌ Erro ao enviar e-mail:', emailError);
          }

          return NextResponse.json({ 
            status: 'completed', 
            paymentStatus: 'paid' 
          });
        } else {
          console.log('[Status Polling] ⏳ Pagamento ainda pendente no Mercado Pago');
        }
      } else {
        console.error('[Status Polling] ❌ Erro ao consultar Mercado Pago:', paymentResponse.status);
      }
    } catch (error) {
      console.error('[Status Polling] ❌ Erro ao consultar Mercado Pago:', error);
    }
  }

  return NextResponse.json({ 
    status: order.status, 
    paymentStatus: order.paymentStatus 
  });
}
