import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { orders, orderItems, users } from '@/lib/db/schema';
import { desc, eq, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Buscar pedidos com informações do usuário
    let query = db
      .select({
        order: orders,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);

    // Filtrar por status se fornecido
    if (status && status !== 'all') {
      query = query.where(eq(orders.status, status)) as typeof query;
    }

    const results = await query;

    // Buscar itens para cada pedido
    const ordersWithItems = await Promise.all(
      results.map(async ({ order, user }) => {
        const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));

        return {
          ...order,
          user: user?.name || order.email,
          itemsCount: items.length,
        };
      })
    );

    // Buscar estatísticas
    const stats = await db
      .select({
        total: sql<number>`count(*)::int`,
        totalRevenue: sql<number>`sum(${orders.total})::decimal`,
        pending: sql<number>`sum(case when ${orders.status} = 'pending' then 1 else 0 end)::int`,
        completed: sql<number>`sum(case when ${orders.status} = 'completed' then 1 else 0 end)::int`,
        cancelled: sql<number>`sum(case when ${orders.status} = 'cancelled' then 1 else 0 end)::int`,
      })
      .from(orders);

    return NextResponse.json({
      orders: ordersWithItems,
      stats: stats[0],
      pagination: {
        limit,
        offset,
        total: stats[0].total,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
