import { NextRequest } from 'next/server';
import { z } from 'zod';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import { products } from '@/lib/db/schema';
import { inArray } from 'drizzle-orm';

const createPaymentIntentSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      variationId: z.string().uuid().optional(),
      quantity: z.number().int().min(1),
    })
  ),
  userId: z.string().optional(),
  email: z.string().email().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items, userId, email } = createPaymentIntentSchema.parse(body);

    // 1. Buscar produtos reais do banco (NUNCA confiar no frontend)
    const productIds = items.map(item => item.productId);
    const dbProducts = await db.select().from(products).where(inArray(products.id, productIds));

    if (dbProducts.length !== productIds.length) {
      return Response.json({ error: 'Um ou mais produtos não encontrados' }, { status: 400 });
    }

    // 2. Calcular total REAL (preços do banco)
    let total = 0;
    for (const item of items) {
      const product = dbProducts.find(p => p.id === item.productId);
      if (!product) {
        return Response.json(
          { error: `Produto ${item.productId} não encontrado` },
          { status: 400 }
        );
      }
      total += Number(product.price) * item.quantity;
    }

    if (total <= 0) {
      return Response.json({ error: 'Total inválido' }, { status: 400 });
    }

    // 3. Criar Payment Intent no Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100), // Converter R$ para centavos
      currency: 'brl',
      ...(email && { receipt_email: email }), // Adiciona email apenas se fornecido
      metadata: {
        userId: userId || '',
        items: JSON.stringify(items),
      },
    });

    return Response.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Dados inválidos', details: error.issues }, { status: 400 });
    }

    console.error('Erro ao criar Payment Intent:', error);
    return Response.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
