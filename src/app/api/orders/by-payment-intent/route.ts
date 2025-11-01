import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  orders,
  orderItems,
  products,
  productImages,
  variationAttributeValues,
  attributeValues,
  attributes,
} from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const paymentIntentId = searchParams.get('payment_intent'); // Stripe
    const paymentId = searchParams.get('payment_id'); // Pix (Mercado Pago)

    if (!paymentIntentId && !paymentId) {
      return NextResponse.json(
        { error: 'Payment Intent ID ou Payment ID não fornecido' },
        { status: 400 }
      );
    }

    // ✅ Buscar pedido pelo Payment Intent ID (Stripe) OU Payment ID (Pix)
    let orderResult;
    if (paymentIntentId) {
      orderResult = await db
        .select()
        .from(orders)
        .where(eq(orders.stripePaymentIntentId, paymentIntentId))
        .limit(1);
    } else if (paymentId) {
      orderResult = await db.select().from(orders).where(eq(orders.paymentId, paymentId)).limit(1);
    }

    if (!orderResult || orderResult.length === 0) {
      // Buscar todos pedidos para debug
      const allOrders = await db
        .select({
          id: orders.id,
          stripePaymentIntentId: orders.stripePaymentIntentId,
          paymentId: orders.paymentId,
          createdAt: orders.createdAt,
        })
        .from(orders)
        .limit(5);

      return NextResponse.json(
        { error: 'Pedido não encontrado', debug: { paymentIntentId, paymentId, allOrders } },
        { status: 404 }
      );
    }

    const order = orderResult[0];

    // Buscar itens do pedido
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));

    // Enriquecer itens com imagens e atributos
    const enrichedItems = await Promise.all(
      items.map(async item => {
        // Buscar nome do produto original
        const [product] = await db
          .select({ name: products.name })
          .from(products)
          .where(eq(products.id, item.productId))
          .limit(1);

        // Buscar imagem principal do produto ou da variação
        let imageUrl = null;

        if (item.variationId) {
          // Buscar imagem da variação primeiro
          const [variationImage] = await db
            .select()
            .from(productImages)
            .where(eq(productImages.variationId, item.variationId))
            .orderBy(asc(productImages.sortOrder))
            .limit(1);

          if (variationImage) {
            imageUrl = variationImage.url;
          }
        }

        // Se não encontrou imagem da variação, buscar do produto
        if (!imageUrl) {
          const [productImage] = await db
            .select()
            .from(productImages)
            .where(eq(productImages.productId, item.productId))
            .orderBy(asc(productImages.sortOrder))
            .limit(1);

          if (productImage) {
            imageUrl = productImage.url;
          }
        }

        // Buscar atributos da variação
        let variation = null;
        if (item.variationId) {
          const variationAttrs = await db
            .select({
              attributeName: attributes.name,
              attributeValue: attributeValues.value,
            })
            .from(variationAttributeValues)
            .innerJoin(attributes, eq(variationAttributeValues.attributeId, attributes.id))
            .innerJoin(attributeValues, eq(variationAttributeValues.valueId, attributeValues.id))
            .where(eq(variationAttributeValues.variationId, item.variationId));

          if (variationAttrs.length > 0) {
            variation = variationAttrs.reduce(
              (acc, attr) => {
                acc[attr.attributeName] = attr.attributeValue;
                return acc;
              },
              {} as Record<string, string>
            );
          }
        }

        return {
          id: item.id,
          productId: item.productId,
          variationId: item.variationId,
          name: product?.name || item.name,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
          imageUrl,
          variation,
        };
      })
    );

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
      items: enrichedItems,
    });
  } catch (error) {
    console.error('Erro ao buscar pedido:', error);
    return NextResponse.json({ error: 'Erro ao buscar pedido' }, { status: 500 });
  }
}
