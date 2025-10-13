import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { orders, orderItems } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/orders/[id]
 *
 * Retorna detalhes completos de um pedido específico
 * Verifica se o pedido pertence ao usuário autenticado
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const orderId = params.id;

    // 1. Verificar autenticação
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // 2. Buscar pedido
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);

    if (!order) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
    }

    // 3. Verificar propriedade
    // ✅ Aceitar se userId do pedido corresponde OU se email corresponde (para pedidos antigos sem userId)
    const isOwner = 
      order.userId === session.user.id || 
      (order.email === session.user.email && !order.userId);

    if (!isOwner) {
      console.log(`❌ Acesso negado - userId pedido: ${order.userId}, userId sessão: ${session.user.id}, email pedido: ${order.email}, email sessão: ${session.user.email}`);
      return NextResponse.json(
        { error: 'Você não tem permissão para acessar este pedido' },
        { status: 403 }
      );
    }

    // 4. Buscar itens do pedido
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));

    // 5. Retornar dados completos
    return NextResponse.json({
      id: order.id,
      email: order.email,
      status: order.status,
      subtotal: parseFloat(order.subtotal),
      total: parseFloat(order.total),
      paymentProvider: order.paymentProvider,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt.toISOString(),
      paidAt: order.paidAt?.toISOString() || null,
      updatedAt: order.updatedAt?.toISOString() || null, // ✅ Data de atualização (útil para cancelamento)
      items: items.map(item => ({
        id: item.id,
        productId: item.productId,
        variationId: item.variationId,
        name: item.name,
        quantity: item.quantity,
        price: parseFloat(item.price),
        total: parseFloat(item.total),
      })),
    });
  } catch (error) {
    console.error('❌ Erro ao buscar pedido:', error);
    return NextResponse.json({ error: 'Erro ao buscar pedido' }, { status: 500 });
  }
}
