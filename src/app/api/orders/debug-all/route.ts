import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';

/**
 * GET /api/orders/debug-all
 *
 * ⚠️ APENAS PARA DEBUG - Lista TODOS os pedidos no banco
 * REMOVER EM PRODUÇÃO
 */
export async function GET() {
  try {
    // Buscar TODOS os pedidos
    const allOrders = await db
      .select({
        id: orders.id,
        status: orders.status,
        email: orders.email,
        userId: orders.userId,
        total: orders.total,
        createdAt: orders.createdAt,
        stripePaymentIntentId: orders.stripePaymentIntentId,
      })
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(20);

    console.log(`🔍 DEBUG: Total de pedidos no banco: ${allOrders.length}`);

    return NextResponse.json({
      total: allOrders.length,
      orders: allOrders.map(order => ({
        id: order.id.slice(0, 13) + '...',
        status: order.status,
        email: order.email,
        userId: order.userId ? order.userId.slice(0, 13) + '...' : 'NULL',
        total: order.total,
        createdAt: order.createdAt,
        paymentIntent: order.stripePaymentIntentId?.slice(0, 15) + '...' || 'N/A',
      })),
    });
  } catch (error) {
    console.error('❌ Erro ao buscar pedidos (debug):', error);
    return NextResponse.json({ error: 'Erro ao buscar pedidos' }, { status: 500 });
  }
}
