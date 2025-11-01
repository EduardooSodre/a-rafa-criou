import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';
import { products, productVariations, coupons } from '@/lib/db/schema';
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
  couponCode: z.string().optional().nullable(),
  discount: z.number().optional(),
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

    const email = session.user.email;
    const userId = (session.user as { id?: string }).id || null; // ✅ Capturar userId da sessão (pode ser null para OAuth sem user no DB)

    const body = await req.json();
    const { items, description, couponCode, discount } = PixSchema.parse(body);

    // Buscar todos os produtos do carrinho
    const productIds = [...new Set(items.map(item => item.productId))];
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
        ? await db
            .select()
            .from(productVariations)
            .where(inArray(productVariations.id, variationIds))
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
        console.log(
          `[Pix] Item com variação: ${variation.name} - R$ ${itemPrice} x ${item.quantity}`
        );
      } else {
        const product = dbProducts.find(p => p.id === item.productId);
        if (!product) {
          return NextResponse.json(
            { error: `Produto ${item.productId} não encontrado` },
            { status: 400 }
          );
        }
        itemPrice = Number(product.price);
        console.log(
          `[Pix] Item sem variação: ${product.name} - R$ ${itemPrice} x ${item.quantity}`
        );
      }
      amount += itemPrice * item.quantity;
    }

    console.log(`[Pix] Total calculado: R$ ${amount.toFixed(2)}`);

    if (amount <= 0) {
      return NextResponse.json({ error: 'Total inválido' }, { status: 400 });
    }

    // Aplicar desconto de cupom se fornecido
    let finalAmount = amount;
    let appliedDiscount = 0;

    if (couponCode && discount && discount > 0) {
      // Validar cupom no banco
      const [coupon] = await db.select().from(coupons).where(eq(coupons.code, couponCode)).limit(1);

      if (!coupon) {
        return NextResponse.json({ error: 'Cupom inválido' }, { status: 400 });
      }

      // Validar se cupom está ativo
      if (!coupon.isActive) {
        return NextResponse.json({ error: 'Cupom não está ativo' }, { status: 400 });
      }

      // Validar datas
      const now = new Date();
      if (coupon.startsAt && new Date(coupon.startsAt) > now) {
        return NextResponse.json({ error: 'Cupom ainda não está válido' }, { status: 400 });
      }
      if (coupon.endsAt && new Date(coupon.endsAt) < now) {
        return NextResponse.json({ error: 'Cupom expirado' }, { status: 400 });
      }

      // Validar total mínimo
      if (coupon.minSubtotal && amount < Number(coupon.minSubtotal)) {
        return NextResponse.json(
          {
            error: `Valor mínimo de R$ ${Number(coupon.minSubtotal).toFixed(2)} não atingido`,
          },
          { status: 400 }
        );
      }

      // Aplicar desconto
      appliedDiscount = Math.min(discount, amount); // Garantir que desconto não seja maior que total
      finalAmount = amount - appliedDiscount;

      console.log('[Pix] Cupom aplicado:', couponCode);
      console.log('[Pix] Desconto:', appliedDiscount);
      console.log('[Pix] Total final:', finalAmount);
    }

    if (finalAmount <= 0) {
      return NextResponse.json({ error: 'Total inválido após desconto' }, { status: 400 });
    }

    // Logging básico
    console.log(`[Pix] Criando pagamento: ${email}, valor: ${finalAmount}`); // Mercado Pago espera valor em reais, mas pode exigir inteiro (centavos)
    // Stripe usa centavos, Mercado Pago geralmente usa reais, mas alguns erros podem ocorrer se não for inteiro
    const transactionAmount = Math.round(finalAmount * 100) / 100; // Garante 2 casas decimais
    const payment_data = {
      transaction_amount: transactionAmount,
      description,
      payment_method_id: 'pix',
      payer: { email },
    };

    // Gerar UUID para idempotência
    const idempotencyKey = crypto.randomUUID();
    // Chamada HTTP direta à API Mercado Pago
    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
        'X-Idempotency-Key': idempotencyKey,
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

    // Criar ordem no banco
    const { orders, orderItems } = await import('@/lib/db/schema');
    const createdOrderArr = await db
      .insert(orders)
      .values({
        userId, // ✅ Adicionar userId ao pedido
        email,
        status: 'pending',
        subtotal: amount.toString(),
        discountAmount: appliedDiscount.toString(),
        total: finalAmount.toString(),
        currency: 'BRL',
        paymentProvider: 'pix',
        paymentId: payment.id,
        paymentStatus: 'pending', // ✅ SEMPRE 'pending' na criação (será 'paid' quando completado)
        ...(couponCode && { couponCode }), // ✅ Adicionar cupom se aplicado
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    const createdOrder = createdOrderArr[0];

    console.log('═══════════════════════════════════════════════════════');
    console.log('[Pix] ✅ ORDEM CRIADA NO BANCO COM SUCESSO!');
    console.log('[Pix] Order ID:', createdOrder.id);
    console.log('[Pix] Payment ID (Mercado Pago):', payment.id);
    console.log('[Pix] Status inicial:', createdOrder.status);
    console.log('[Pix] Subtotal:', `R$ ${amount.toFixed(2)}`);
    if (appliedDiscount > 0) {
      console.log('[Pix] Desconto (', couponCode, '):', `R$ ${appliedDiscount.toFixed(2)}`);
    }
    console.log('[Pix] Total:', `R$ ${finalAmount.toFixed(2)}`);
    console.log('[Pix] IMPORTANTE: Este payment_id deve aparecer no webhook!');
    console.log('═══════════════════════════════════════════════════════');

    // Criar itens do pedido
    for (const item of items) {
      // Buscar nome do produto e preço da variação/produto
      let nomeProduto = description;
      let preco = '0';

      if (item.variationId) {
        // Buscar produto base
        const product = dbProducts.find(p => p.id === item.productId);
        const variation = dbVariations.find(v => v.id === item.variationId);
        
        if (product && variation) {
          nomeProduto = product.name; // ✅ Nome do produto, não da variação
          preco = variation.price;     // ✅ Preço da variação
        }
      } else {
        const product = dbProducts.find(p => p.id === item.productId);
        if (product) {
          nomeProduto = product.name;
          preco = product.price;
        }
      }

      // Calcular total do item (preço original * quantidade)
      const itemSubtotal = Number(preco) * item.quantity;

      // Se houver desconto, aplicar proporcionalmente ao item
      let itemTotal = itemSubtotal;
      if (appliedDiscount > 0 && amount > 0) {
        // Calcular desconto proporcional: (subtotal_item / subtotal_total) * desconto_total
        const proportionalDiscount = (itemSubtotal / amount) * appliedDiscount;
        itemTotal = itemSubtotal - proportionalDiscount;
      }

      await db.insert(orderItems).values({
        orderId: createdOrder.id,
        productId: item.productId,
        variationId: item.variationId,
        name: nomeProduto, // ✅ Nome do produto
        price: preco.toString(),
        quantity: item.quantity,
        total: itemTotal.toFixed(2),
        createdAt: new Date(),
      });
    }
    return NextResponse.json({
      qr_code: payment.point_of_interaction.transaction_data.qr_code,
      qr_code_base64: payment.point_of_interaction.transaction_data.qr_code_base64,
      payment_id: payment.id,
      order_id: createdOrder.id,
    });

    // Função auxiliar para pegar preço correto
    // Função auxiliar removida (lógica incorporada acima)
  } catch (error) {
    // Logging de erro
    console.error('[Pix] Erro:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
