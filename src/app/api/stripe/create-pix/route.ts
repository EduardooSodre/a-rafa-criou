/**
 * API: Criar Payment Intent PIX com Stripe
 * 
 * POST /api/stripe/create-pix
 * 
 * Body: {
 *   items: [{ productId, variationId?, quantity }],
 *   email: string,
 *   name: string
 * }
 * 
 * Retorna: QR Code PIX e instruções para pagamento
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import { products, productVariations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Schema de validação
const createPixSchema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    variationId: z.string().optional(),
    quantity: z.number().positive(),
  })),
  email: z.string().email(),
  name: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, email, name } = createPixSchema.parse(body);

    // 1. Validar produtos e calcular total
    let total = 0;
    const lineItems = [];

    for (const item of items) {
      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.id, item.productId))
        .limit(1);

      if (!product) {
        return NextResponse.json(
          { error: `Produto ${item.productId} não encontrado` },
          { status: 404 }
        );
      }

      let itemPrice = parseFloat(product.price);
      let variationName = '';

      // Verificar variação
      if (item.variationId) {
        const [variation] = await db
          .select()
          .from(productVariations)
          .where(eq(productVariations.id, item.variationId))
          .limit(1);

        if (variation) {
          itemPrice = parseFloat(variation.price);
          variationName = ` - ${variation.name}`;
        }
      }

      const itemTotal = itemPrice * item.quantity;
      total += itemTotal;

      lineItems.push({
        price_data: {
          currency: 'brl',
          product_data: {
            name: `${product.name}${variationName}`,
            description: product.description || undefined,
          },
          unit_amount: Math.round(itemPrice * 100), // Centavos
        },
        quantity: item.quantity,
      });
    }

    // 2. Criar Payment Intent com PIX
    // NOTA: PIX só funciona em produção com conta BR ativada
    // Em teste, vamos usar 'card' mas simular como PIX
    const isProduction = process.env.NODE_ENV === 'production';
    const paymentMethodTypes = isProduction ? ['pix'] : ['card'];

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100), // Centavos
      currency: 'brl', // IMPORTANTE: Forçar BRL
      payment_method_types: paymentMethodTypes,
      metadata: {
        customer_email: email,
        customer_name: name,
        items: JSON.stringify(items),
        payment_type: 'pix', // Identificar como PIX
        payment_method: 'pix', // Adicional
      },
      description: `Pedido A Rafa Criou - PIX - ${email}`,
      // Dados do cliente
      receipt_email: email,
    });

    // 3. Retornar dados do PIX
    // Nota: O QR Code PIX será gerado no frontend usando o client_secret
    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: total,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Erro ao criar Payment Intent PIX:', error);
    return NextResponse.json(
      { 
        error: 'Erro ao criar pagamento PIX',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
