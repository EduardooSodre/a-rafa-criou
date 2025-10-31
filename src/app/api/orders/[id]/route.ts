import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { 
  orders, 
  orderItems, 
  products,
  productImages, 
  variationAttributeValues, 
  attributeValues, 
  attributes 
} from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';

/**
 * GET /api/orders/[id]
 *
 * Retorna detalhes completos de um pedido específico
 * Verifica se o pedido pertence ao usuário autenticado
 */
export async function GET(req: NextRequest, context: unknown) {
  try {
    // Next.js context.params may be a Promise in some runtime types; normalize safely
    type Thenable = { then?: (...args: unknown[]) => unknown };
    let rawParams: unknown = undefined;
    if (typeof context === 'object' && context !== null) {
      const ctx = context as { params?: unknown };
      rawParams = ctx.params;
    }
    const params =
      rawParams && typeof (rawParams as Thenable).then === 'function'
        ? await (rawParams as Promise<unknown>)
        : rawParams;
    const paramsObj = params as Record<string, unknown> | undefined;
    const orderId = String(paramsObj?.id ?? '');

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
      order.userId === session.user.id || (order.email === session.user.email && !order.userId);

    if (!isOwner) {
      console.log(
        `❌ Acesso negado - userId pedido: ${order.userId}, userId sessão: ${session.user.id}, email pedido: ${order.email}, email sessão: ${session.user.email}`
      );
      return NextResponse.json(
        { error: 'Você não tem permissão para acessar este pedido' },
        { status: 403 }
      );
    }

    // 4. Buscar itens do pedido
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));

    // 5. Buscar imagens e variações para cada item
    const enrichedItems = await Promise.all(
      items.map(async (item) => {
        // Buscar nome do produto original (sem variação)
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
            variation = variationAttrs.reduce((acc, attr) => {
              acc[attr.attributeName] = attr.attributeValue;
              return acc;
            }, {} as Record<string, string>);
          }
        }

        return {
          id: item.id,
          productId: item.productId,
          variationId: item.variationId,
          name: product?.name || item.name, // Usar nome do produto, fallback para snapshot
          quantity: item.quantity,
          price: parseFloat(item.price),
          total: parseFloat(item.total),
          imageUrl,
          variation,
        };
      })
    );

    // 6. Retornar dados completos
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
      updatedAt: order.updatedAt?.toISOString() || null,
      items: enrichedItems,
    });
  } catch (error) {
    console.error('❌ Erro ao buscar pedido:', error);
    return NextResponse.json({ error: 'Erro ao buscar pedido' }, { status: 500 });
  }
}
