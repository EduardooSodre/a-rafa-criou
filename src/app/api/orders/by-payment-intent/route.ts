import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, orderItems, products, productVariations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const paymentIntentId = searchParams.get('payment_intent');

    if (!paymentIntentId) {
      return NextResponse.json({ error: 'Payment Intent ID não fornecido' }, { status: 400 });
    }

    // Buscar pedido pelo Payment Intent ID
    const orderResult = await db
      .select()
      .from(orders)
      .where(eq(orders.stripePaymentIntentId, paymentIntentId))
      .limit(1);

    if (orderResult.length === 0) {
      // Buscar todos pedidos para debug
      const allOrders = await db
        .select({
          id: orders.id,
          stripePaymentIntentId: orders.stripePaymentIntentId,
          createdAt: orders.createdAt,
        })
        .from(orders)
        .limit(5);

      return NextResponse.json(
        { error: 'Pedido não encontrado', debug: { paymentIntentId, allOrders } },
        { status: 404 }
      );
    }

    const order = orderResult[0];

    // Buscar itens do pedido com detalhes dos produtos
    const items = await db
      .select({
        id: orderItems.id,
        name: orderItems.name,
        price: orderItems.price,
        quantity: orderItems.quantity,
        total: orderItems.total,
        productId: orderItems.productId,
        variationId: orderItems.variationId,
        productSlug: products.slug,
        variationName: productVariations.name,
      })
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .leftJoin(productVariations, eq(orderItems.variationId, productVariations.id))
      .where(eq(orderItems.orderId, order.id));

    return NextResponse.json({
      order: {
        id: order.id,
        email: order.email,
        status: order.status,
        paymentStatus: order.paymentStatus,
        subtotal: order.subtotal,
        discountAmount: order.discountAmount,
        total: order.total,
        currency: order.currency,
        paymentProvider: order.paymentProvider,
        paidAt: order.paidAt,
        createdAt: order.createdAt,
      },
      items: items.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        total: item.total,
        variationName: item.variationName,
        productSlug: item.productSlug,
      })),
    });
  } catch (error) {
    console.error('Erro ao buscar pedido:', error);
    return NextResponse.json({ error: 'Erro ao buscar pedido' }, { status: 500 });
  }
}
