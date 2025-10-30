import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';
import { products, productVariations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Rate limiting simples (pode ser aprimorado com Redis ou outro storage)
let lastRequest = 0;
const RATE_LIMIT_MS = 2000;

const PixSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      variationId: z.string().uuid().optional(),
      quantity: z.number().int().min(1),
    })
  ),
  description: z.string().min(1),
});

export async function POST(req: NextRequest) {
  // Rate limiting básico
  const now = Date.now();
  if (now - lastRequest < RATE_LIMIT_MS) {
    return NextResponse.json({ error: 'Aguarde antes de tentar novamente.' }, { status: 429 });
  }
  lastRequest = now;

  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Usuário não autenticado.' }, { status: 401 });
    }

    const body = await req.json();
    const { items, description } = PixSchema.parse(body);

    // Buscar todos os produtos do carrinho
    const productIds = items.map(item => item.productId);
    const variationIds = items
      .map(item => item.variationId)
      .filter((id): id is string => id !== undefined);

    const { inArray } = await import('drizzle-orm');
    const dbProducts = await db.select().from(products).where(inArray(products.id, productIds));
    if (dbProducts.length !== productIds.length) {
      return NextResponse.json({ error: 'Um ou mais produtos não encontrados' }, { status: 400 });
    }

    const dbVariations =
      variationIds.length > 0
        ? await db.select().from(productVariations).where(inArray(productVariations.id, variationIds))
        : [];

    // Calcular total REAL (preços do banco)
    let amount = 0;
    for (const item of items) {
      let itemPrice = 0;
      if (item.variationId) {
        const variation = dbVariations.find(v => v.id === item.variationId);
        if (!variation) {
          return NextResponse.json(
            { error: `Variação ${item.variationId} não encontrada` },
            { status: 400 }
          );
        }
        itemPrice = Number(variation.price);
      } else {
        const product = dbProducts.find(p => p.id === item.productId);
        if (!product) {
          return NextResponse.json(
            { error: `Produto ${item.productId} não encontrado` },
            { status: 400 }
          );
        }
        itemPrice = Number(product.price);
      }
      amount += itemPrice * item.quantity;
    }
    if (amount <= 0) {
      return NextResponse.json({ error: 'Total inválido' }, { status: 400 });
    }
    const email = session.user.email;

    // Logging básico
    console.log(`[Pix] Criando pagamento: ${email}, valor: ${amount}`);

    // Mercado Pago espera valor em reais, mas pode exigir inteiro (centavos)
    // Stripe usa centavos, Mercado Pago geralmente usa reais, mas alguns erros podem ocorrer se não for inteiro
    const transactionAmount = Math.round(amount * 100) / 100; // Garante 2 casas decimais
    const payment_data = {
      transaction_amount: transactionAmount,
      description,
      payment_method_id: 'pix',
      payer: { email },
    };

    // Chamada HTTP direta à API Mercado Pago
    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(payment_data),
    });
    const payment = await response.json();

    if (payment.status !== 'pending') {
      console.error('[Pix] Mercado Pago erro:', payment);
      return NextResponse.json(
        { error: 'Erro ao criar pagamento Pix.', details: payment },
        { status: 400 }
      );
    }

    return NextResponse.json({
      qr_code: payment.point_of_interaction.transaction_data.qr_code,
      qr_code_base64: payment.point_of_interaction.transaction_data.qr_code_base64,
      payment_id: payment.id,
    });
  } catch (error) {
    // Logging de erro
    console.error('[Pix] Erro:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
