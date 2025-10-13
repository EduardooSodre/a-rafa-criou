/**
 * API: Cancelar pedido pendente
 * 
 * POST /api/orders/cancel
 * Body: { orderId: string }
 * 
 * Segurança:
 * - Valida que pedido existe e está pendente
 * - Cancela Payment Intent no Stripe (se existir)
 * - Atualiza status do pedido para 'cancelled'
 * - Apenas pedidos 'pending' podem ser cancelados
 * 
 * Retorna: { success: true, message: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import { orders } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json();

    console.log(`🚫 Cancelando pedido: ${orderId}`);

    if (!orderId) {
      return NextResponse.json(
        { error: 'orderId é obrigatório' },
        { status: 400 }
      );
    }

    // 1. 🔒 Buscar pedido e validar
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) {
      console.log(`❌ Pedido ${orderId} não encontrado`);
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 }
      );
    }

    console.log(`✅ Pedido encontrado: ${order.id} - Status: ${order.status}`);

    // 2. 🔒 Validar que pedido está pendente
    if (order.status === 'cancelled') {
      console.log(`⚠️ Pedido ${orderId} já está cancelado`);
      return NextResponse.json(
        { success: true, message: 'Pedido já estava cancelado' },
        { status: 200 }
      );
    }

    if (order.status === 'completed') {
      console.log(`❌ Pedido ${orderId} já foi pago, não pode ser cancelado`);
      return NextResponse.json(
        { error: 'Pedido já foi pago e não pode ser cancelado' },
        { status: 400 }
      );
    }

    if (order.status !== 'pending') {
      console.log(`❌ Pedido ${orderId} não está pendente (status: ${order.status})`);
      return NextResponse.json(
        { error: 'Apenas pedidos pendentes podem ser cancelados' },
        { status: 400 }
      );
    }

    // 3. 🔒 Cancelar Payment Intent no Stripe (se existir)
    if (order.stripePaymentIntentId) {
      try {
        console.log(`💳 Cancelando Payment Intent: ${order.stripePaymentIntentId}`);
        
        const paymentIntent = await stripe.paymentIntents.retrieve(
          order.stripePaymentIntentId
        );

        // Só cancelar se ainda estiver em estado cancelável
        if (
          paymentIntent.status !== 'succeeded' && 
          paymentIntent.status !== 'canceled'
        ) {
          await stripe.paymentIntents.cancel(order.stripePaymentIntentId);
          console.log(`✅ Payment Intent cancelado com sucesso`);
        } else {
          console.log(`⚠️ Payment Intent já está em estado final: ${paymentIntent.status}`);
        }
      } catch (stripeError) {
        // Se falhar ao cancelar no Stripe, logar mas continuar
        // (o pedido ainda deve ser marcado como cancelado no DB)
        console.error('⚠️ Erro ao cancelar Payment Intent no Stripe:', stripeError);
        console.log('⚠️ Continuando com cancelamento do pedido...');
      }
    }

    // 4. ✅ Atualizar status do pedido para 'cancelled'
    await db
      .update(orders)
      .set({ 
        status: 'cancelled',
        updatedAt: new Date()
      })
      .where(eq(orders.id, orderId));

    console.log(`✅ Pedido ${orderId} cancelado com sucesso`);

    return NextResponse.json({
      success: true,
      message: 'Pedido cancelado com sucesso',
    });

  } catch (error) {
    console.error('❌ Erro ao cancelar pedido:', error);
    return NextResponse.json(
      { error: 'Erro ao cancelar pedido' },
      { status: 500 }
    );
  }
}
