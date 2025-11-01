import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import { orders, orderItems, products, productVariations, files } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { resend, FROM_EMAIL } from '@/lib/email';
import { PurchaseConfirmationEmail } from '@/emails/purchase-confirmation';
import { render } from '@react-email/render';
import { getR2SignedUrl } from '@/lib/r2-utils';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return Response.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err);
    return Response.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }

  // Processar evento: payment_intent.succeeded
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    try {
      // Parsear metadata
      const items = JSON.parse(paymentIntent.metadata.items || '[]');
      const userId = paymentIntent.metadata.userId || null;
      const customerEmail =
        paymentIntent.receipt_email ||
        paymentIntent.metadata.customer_email ||
        paymentIntent.metadata.email ||
        '';
      const customerName =
        paymentIntent.metadata.customer_name || paymentIntent.metadata.userName || 'Cliente';

      // 🔍 Buscar pedido pendente existente (criado no create-pix)
      const existingOrders = await db
        .select()
        .from(orders)
        .where(eq(orders.stripePaymentIntentId, paymentIntent.id))
        .limit(1);

      let order;
      const orderItemsData: Array<{
        id: string;
        productId?: string | null;
        productName: string;
        variationName: string;
        price: number;
        quantity: number;
        variationId: string | null;
      }> = [];

      if (existingOrders.length > 0) {
        // ✅ ATUALIZAR pedido existente para "completed"
        const existingOrder = existingOrders[0];
        console.log(`📦 Atualizando pedido existente: ${existingOrder.id}`);

        // 🔒 VALIDAÇÃO DE SEGURANÇA: Verificar integridade dos valores
        const orderTotal = parseFloat(existingOrder.total);
        const paidAmount = paymentIntent.amount / 100;

        // Permitir diferença de até 0.01 (arredondamento)
        if (Math.abs(orderTotal - paidAmount) > 0.01) {
          console.error(`⚠️ ALERTA DE SEGURANÇA: Valores não conferem!`);
          console.error(`Pedido: R$ ${orderTotal} | Pago: R$ ${paidAmount}`);

          // Não atualizar pedido se valores não conferem
          return Response.json(
            {
              error: 'Valores não conferem',
              received: false,
            },
            { status: 400 }
          );
        }

        const updatedOrders = await db
          .update(orders)
          .set({
            status: 'completed', // ⚠️ pending → completed
            paymentStatus: 'paid',
            paidAt: new Date(),
          })
          .where(eq(orders.id, existingOrder.id))
          .returning();

        order = updatedOrders[0];
        console.log(`✅ Pedido atualizado: ${order.id} (pending → completed)`);

        // Buscar itens do pedido já criados
        const existingItems = await db
          .select()
          .from(orderItems)
          .where(eq(orderItems.orderId, order.id));

        // Converter para formato esperado pelo email
        for (const item of existingItems) {
          orderItemsData.push({
            id: item.id,
            productId: item.productId,
            productName: item.name,
            variationName: '', // Já está no name
            price: parseFloat(item.price),
            quantity: item.quantity,
            variationId: item.variationId,
          });
        }
      } else {
        // ⚠️ CRIAR pedido (fallback se não foi criado no create-pix)
        console.log('⚠️ Pedido não encontrado, criando novo...');

        // Extrair dados do cupom dos metadados
        const couponCode = paymentIntent.metadata.couponCode || null;
        const originalTotal = paymentIntent.metadata.originalTotal 
          ? parseFloat(paymentIntent.metadata.originalTotal)
          : (paymentIntent.amount / 100);
        const discount = paymentIntent.metadata.discount 
          ? parseFloat(paymentIntent.metadata.discount)
          : 0;
        const finalTotal = paymentIntent.amount / 100;

        const newOrders = await db
          .insert(orders)
          .values({
            userId,
            email: customerEmail,
            status: 'completed',
            subtotal: originalTotal.toString(),
            discountAmount: discount.toString(),
            total: finalTotal.toString(),
            currency: paymentIntent.currency.toUpperCase(),
            paymentProvider: 'stripe',
            paymentId: paymentIntent.id,
            stripePaymentIntentId: paymentIntent.id,
            paymentStatus: 'paid',
            paidAt: new Date(),
            ...(couponCode && { couponCode }),
          })
          .returning();

        order = newOrders[0];

        // Criar itens do pedido apenas se for um novo pedido
        for (const item of items) {
          const [productData] = await db
            .select({
              productId: products.id,
              productName: products.name,
              variationId: productVariations.id,
              variationName: productVariations.name,
              price: productVariations.price,
            })
            .from(products)
            .leftJoin(productVariations, eq(productVariations.productId, products.id))
            .where(eq(products.id, item.productId))
            .limit(1);

          if (!productData || !productData.price) continue;

          const itemPrice = parseFloat(productData.price);
          const itemTotal = itemPrice * item.quantity;

          const createdItems = await db
            .insert(orderItems)
            .values({
              orderId: order.id,
              productId: item.productId,
              variationId: item.variationId || null,
              name: productData.productName || 'Produto',
              quantity: item.quantity,
              price: productData.price,
              total: itemTotal.toString(),
            })
            .returning();

          const createdItem = createdItems[0];

          orderItemsData.push({
            id: createdItem.id,
            productId: createdItem.productId,
            productName: productData.productName || 'Produto',
            variationName: productData.variationName || '',
            price: itemPrice,
            quantity: item.quantity,
            variationId: item.variationId,
          });
        }
      }

      // 🚀 ENVIAR E-MAIL DE CONFIRMAÇÃO
      if (customerEmail) {
        try {
          // Gerar URLs assinadas para cada produto
          const productsWithDownloadUrls = await Promise.all(
            orderItemsData.map(async item => {
              // Buscar arquivo preferindo variationId, senão productId
              let downloadUrl = '';

              // try variation
              if (item.variationId) {
                const byVar = await db
                  .select({ filePath: files.path })
                  .from(files)
                  .where(eq(files.variationId, item.variationId))
                  .limit(1);

                if (byVar.length > 0 && byVar[0]?.filePath) {
                  downloadUrl = await getR2SignedUrl(byVar[0].filePath, 15 * 60);
                }
              }

              // fallback to product file
              if (!downloadUrl && item.productId) {
                const byProd = await db
                  .select({ filePath: files.path })
                  .from(files)
                  .where(eq(files.productId, String(item.productId)))
                  .limit(1);

                if (byProd.length > 0 && byProd[0]?.filePath) {
                  downloadUrl = await getR2SignedUrl(byProd[0].filePath, 15 * 60);
                }
              }

              return {
                name: item.productName,
                variationName: item.variationName || undefined,
                price: item.price,
                downloadUrl,
              };
            })
          );

          console.log(
            '📦 Produtos com URLs de download geradas para envio:',
            productsWithDownloadUrls.map(p => ({ name: p.name, hasUrl: !!p.downloadUrl }))
          );

          // Renderizar e enviar e-mail
          const emailHtml = await render(
            PurchaseConfirmationEmail({
              customerName,
              orderId: order.id,
              orderDate: new Date().toLocaleDateString('pt-BR'),
              products: productsWithDownloadUrls,
              totalAmount: parseFloat(order.total),
            })
          );

          await resend.emails.send({
            from: FROM_EMAIL,
            to: customerEmail,
            subject: `✅ Pedido Confirmado #${order.id.slice(0, 8)} - A Rafa Criou`,
            html: emailHtml,
          });

          console.log(`📧 Email de confirmação enviado para: ${customerEmail}`);
        } catch (emailError) {
          console.error('⚠️ Erro ao enviar email de confirmação:', emailError);
          // Não bloquear o webhook se o e-mail falhar
        }
      }
    } catch (error) {
      console.error('❌ Erro ao processar webhook:', error);
      return Response.json({ error: 'Internal error' }, { status: 500 });
    }
  }

  return Response.json({ received: true });
}
