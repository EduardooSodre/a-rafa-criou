import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { orders, orderItems } from '@/lib/db/schema';
import { eq, desc, or } from 'drizzle-orm';

/**
 * GET /api/orders/my-orders
 *
 * Retorna todos os pedidos do usuário autenticado (por userId OU email)
 */
export async function GET() {
  try {
    // 1. Verificar autenticação
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // 2. Buscar pedidos do usuário por userId OU email
    // Isso pega pedidos feitos antes de logar (só com email) e depois de logar (com userId)
    const userOrders = await db
      .select({
        id: orders.id,
        status: orders.status,
        total: orders.total,
        createdAt: orders.createdAt,
        email: orders.email,
        userId: orders.userId,
      })
      .from(orders)
      .where(
        or(
          eq(orders.userId, session.user.id),
          eq(orders.email, session.user.email)
        )
      )
      .orderBy(desc(orders.createdAt));

    console.log(`📊 Buscando pedidos para userId: ${session.user.id}, email: ${session.user.email}`);
    console.log(`📦 Total de pedidos encontrados: ${userOrders.length}`);
    console.log(`📋 Status:`, userOrders.map(o => `${o.id.slice(0, 8)} - ${o.status}`));

    // 3. Para cada pedido, buscar os itens
    const ordersWithItems = await Promise.all(
      userOrders.map(async order => {
        const items = await db
          .select({
            id: orderItems.id,
            name: orderItems.name,
            quantity: orderItems.quantity,
            price: orderItems.price,
          })
          .from(orderItems)
          .where(eq(orderItems.orderId, order.id));

        return {
          id: order.id,
          status: order.status,
          total: parseFloat(order.total),
          createdAt: order.createdAt.toISOString(),
          items: items.map(item => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: parseFloat(item.price),
          })),
          itemCount: items.length,
        };
      })
    );

    return NextResponse.json({
      orders: ordersWithItems,
    });
  } catch (error) {
    console.error('❌ Erro ao buscar pedidos:', error);
    return NextResponse.json({ error: 'Erro ao buscar pedidos' }, { status: 500 });
  }
}
