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
import { products, productVariations, orders, orderItems } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { Resend } from 'resend';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';

// Schema de validação
const createPixSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string(),
      variationId: z.string().optional(),
      quantity: z.number().positive(),
    })
  ),
  email: z.string().email(),
  name: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, email, name } = createPixSchema.parse(body);

    // 🔒 Verificar se há usuário logado
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || null;

    console.log(`👤 Usuário logado: ${userId ? userId : 'Não (checkout como convidado)'}`);

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

    // 2. 🔒 VERIFICAR SE JÁ EXISTE PEDIDO PENDENTE IDÊNTICO (evitar duplicação)
    // Criar hash dos itens para comparação (email + produtos + variações + quantidades + total)
    const sortedItems = items
      .map(i => ({
        productId: String(i.productId),
        variationId: i.variationId ? String(i.variationId) : null,
        quantity: i.quantity,
      }))
      .sort((a, b) => a.productId.localeCompare(b.productId));

    const itemsHash = JSON.stringify({
      email,
      items: sortedItems,
      total: total.toFixed(2),
    });

    console.log(`🔍 Verificando duplicação - Hash novo pedido: ${itemsHash.substring(0, 100)}...`);

    // Buscar pedidos pendentes criados nos últimos 30 minutos para este email
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const existingPendingOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.email, email))
      .orderBy(desc(orders.createdAt))
      .limit(5);

    console.log(`🔍 Encontrados ${existingPendingOrders.length} pedidos para ${email}`);

    // Verificar se algum pedido pendente é IDÊNTICO (mesmos itens + valor)
    let identicalPendingOrder = null;

    for (const order of existingPendingOrders) {
      console.log(
        `🔍 Verificando pedido ${order.id} - Status: ${order.status}, Total: ${order.total}`
      );

      if (
        order.status === 'pending' &&
        order.createdAt >= thirtyMinutesAgo &&
        order.stripePaymentIntentId &&
        parseFloat(order.total).toFixed(2) === total.toFixed(2)
      ) {
        // Buscar itens do pedido para comparar
        const orderItemsData = await db
          .select()
          .from(orderItems)
          .where(eq(orderItems.orderId, order.id));

        console.log(`🔍 Pedido ${order.id} tem ${orderItemsData.length} itens`);

        // Criar hash dos itens do pedido existente
        const existingSortedItems = orderItemsData
          .map(i => ({
            productId: String(i.productId),
            variationId: i.variationId ? String(i.variationId) : null,
            quantity: i.quantity,
          }))
          .sort((a, b) => a.productId.localeCompare(b.productId));

        const existingItemsHash = JSON.stringify({
          email: order.email,
          items: existingSortedItems,
          total: parseFloat(order.total).toFixed(2),
        });

        console.log(`🔍 Hash pedido existente: ${existingItemsHash.substring(0, 100)}...`);

        // Se hash é idêntico, é o mesmo pedido (duplicação)
        if (itemsHash === existingItemsHash) {
          console.log(`✅ MATCH! Pedido idêntico encontrado: ${order.id}`);
          identicalPendingOrder = order;
          break;
        } else {
          console.log(`❌ Hashes diferentes, não é duplicata`);
        }
      }
    }

    let paymentIntent;

    if (identicalPendingOrder && identicalPendingOrder.stripePaymentIntentId) {
      // ♻️ REUTILIZAR Payment Intent existente (pedido IDÊNTICO)
      console.log(`♻️ Pedido pendente IDÊNTICO encontrado: ${identicalPendingOrder.id}`);
      console.log(`♻️ Reutilizando Payment Intent: ${identicalPendingOrder.stripePaymentIntentId}`);

      paymentIntent = await stripe.paymentIntents.retrieve(
        identicalPendingOrder.stripePaymentIntentId
      );

      // Retornar imediatamente sem criar novo pedido
      return Response.json({
        clientSecret: paymentIntent.client_secret,
        amount: parseFloat(identicalPendingOrder.total),
        paymentIntentId: paymentIntent.id,
        orderId: identicalPendingOrder.id,
        message: 'Pedido idêntico existente reutilizado',
      });
    }

    // 3. Criar Payment Intent com PIX (apenas se não houver pedido idêntico)
    console.log(`🆕 Nenhum pedido pendente idêntico encontrado, criando novo...`);

    // NOTA: PIX só funciona em produção com conta BR ativada
    // Em teste, vamos usar 'card' mas simular como PIX
    const isProduction = process.env.NODE_ENV === 'production';
    const paymentMethodTypes = isProduction ? ['pix'] : ['card'];

    console.log(
      `💳 Criando Payment Intent - Modo: ${isProduction ? 'PRODUÇÃO (PIX)' : 'DESENVOLVIMENTO (CARD)'}`
    );

    paymentIntent = await stripe.paymentIntents.create({
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

    // 4. Criar pedido com status "pending" (aguardando pagamento)
    const [pendingOrder] = await db
      .insert(orders)
      .values({
        userId: userId, // ✅ Associar ao usuário logado (se houver)
        email: email,
        status: 'pending', // ⚠️ PENDENTE até webhook confirmar
        subtotal: total.toString(),
        total: total.toString(),
        currency: 'BRL',
        paymentProvider: 'stripe',
        paymentId: paymentIntent.id,
        stripePaymentIntentId: paymentIntent.id,
        paymentStatus: 'pending', // ⚠️ PENDENTE
      })
      .returning();

    // 5. Criar itens do pedido
    for (const item of items) {
      const product = await db
        .select()
        .from(products)
        .where(eq(products.id, item.productId))
        .limit(1);

      if (product.length === 0) continue;

      const variation = item.variationId
        ? await db
            .select()
            .from(productVariations)
            .where(eq(productVariations.id, item.variationId))
            .limit(1)
        : null;

      const itemPrice = variation && variation[0]?.price ? parseFloat(variation[0].price) : 0;

      await db.insert(orderItems).values({
        orderId: pendingOrder.id,
        productId: item.productId,
        variationId: item.variationId || null,
        name: `${product[0].name}${variation?.[0]?.name ? ` - ${variation[0].name}` : ''}`,
        quantity: item.quantity,
        price: itemPrice.toString(),
        total: (itemPrice * item.quantity).toString(),
      });
    }

    console.log(`📦 Pedido criado: ${pendingOrder.id} (status: pending)`);
    console.log(`💳 Payment Intent: ${paymentIntent.id}`);

    // 6. Enviar email com instruções PIX
    try {
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #FED466; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #fff; padding: 30px; border: 1px solid #ddd; }
            .footer { background: #f4f4f4; padding: 15px; text-align: center; border-radius: 0 0 10px 10px; }
            .button { background: #FD9555; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
            .info-box { background: #FFF3CD; border-left: 4px solid #FED466; padding: 15px; margin: 20px 0; }
            .amount { font-size: 32px; color: #FD9555; font-weight: bold; text-align: center; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; color: #333;">🎨 A Rafa Criou</h1>
            </div>
            <div class="content">
              <h2>Olá ${name}! 👋</h2>
              <p>Seu pedido foi criado com sucesso e está <strong>aguardando pagamento via PIX</strong>.</p>
              
              <div class="amount">R$ ${total.toFixed(2)}</div>
              
              <div class="info-box">
                <h3 style="margin-top: 0;">📋 Detalhes do Pedido</h3>
                <p><strong>Número:</strong> #${pendingOrder.id.slice(0, 13)}...</p>
                <p><strong>Status:</strong> Aguardando Pagamento</p>
                <p><strong>Forma de Pagamento:</strong> PIX</p>
              </div>

              <h3>🔍 Como Pagar:</h3>
              <p><strong>IMPORTANTE:</strong> Em modo de teste, o PIX não gera QR Code real.</p>
              
              <h4>Opção 1: Simular Pagamento (Desenvolvimento)</h4>
              <ol>
                <li>Acesse a página de checkout PIX</li>
                <li>Clique no botão amarelo "Simular Pagamento PIX"</li>
                <li>Aguarde a confirmação</li>
              </ol>

              <h4>Opção 2: Stripe CLI (Desenvolvimento)</h4>
              <pre style="background: #f4f4f4; padding: 10px; border-radius: 5px;">stripe trigger payment_intent.succeeded</pre>

              <div class="info-box">
                <p><strong>⚠️ Modo de Desenvolvimento Ativo</strong></p>
                <p>Em produção, você receberá um QR Code PIX válido e poderá pagar pelo app do seu banco.</p>
              </div>

              <p>Assim que o pagamento for confirmado, você receberá outro e-mail com os links de download dos seus produtos.</p>
            </div>
            <div class="footer">
              <p style="margin: 0; color: #666;">A Rafa Criou - Planilhas e Templates</p>
            </div>
          </div>
        </body>
        </html>
      `;

      await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: `⏳ Pedido #${pendingOrder.id.slice(0, 8)} - Aguardando Pagamento PIX`,
        html: emailHtml,
      });

      console.log(`📧 Email de instruções PIX enviado para: ${email}`);
    } catch (emailError) {
      console.error('⚠️ Erro ao enviar email de instruções:', emailError);
      // Não bloquear a criação do pedido se o email falhar
    }

    // 7. Retornar dados do PIX
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
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
