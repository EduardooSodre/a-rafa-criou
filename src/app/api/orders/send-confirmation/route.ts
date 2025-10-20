import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, orderItems, files } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getR2SignedUrl } from '@/lib/r2-utils';
import { resend, FROM_EMAIL } from '@/lib/email';
import { PurchaseConfirmationEmail } from '@/emails/purchase-confirmation';
import { render } from '@react-email/render';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');
    const paymentIntent = searchParams.get('payment_intent');

    if (!orderId && !paymentIntent) {
      return NextResponse.json({ error: 'orderId or payment_intent required' }, { status: 400 });
    }

    // Find order
    let orderRes: unknown[] = [];
    if (orderId) {
      orderRes = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    } else if (paymentIntent) {
      orderRes = await db
        .select()
        .from(orders)
        .where(eq(orders.stripePaymentIntentId, String(paymentIntent)))
        .limit(1);
    }

    if (orderRes.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    type OrderRow = {
      id: string;
      email: string;
      paymentStatus?: string | null;
      status?: string | null;
      total: string;
      createdAt: string;
    };
    const order = orderRes[0] as OrderRow;

    // Only send if order is completed/paid
    const paymentStatus = (order.paymentStatus || '').toLowerCase();
    const orderStatus = (order.status || '').toLowerCase();
    const isSuccess =
      orderStatus === 'completed' || paymentStatus === 'succeeded' || paymentStatus === 'paid';

    if (!isSuccess) {
      return NextResponse.json({ error: 'Order payment not approved' }, { status: 403 });
    }

    // Get order items
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));

    // Build products with download URLs
    const products = await Promise.all(
      items.map(async item => {
        // prefer variation file then product file
        let file = null;
        if (item.variationId) {
          const f = await db
            .select({ path: files.path })
            .from(files)
            .where(eq(files.variationId, item.variationId))
            .limit(1);
          file = f[0];
        }
        if (!file) {
          const f = await db
            .select({ path: files.path })
            .from(files)
            .where(eq(files.productId, item.productId))
            .limit(1);
          file = f[0];
        }

        let downloadUrl = '';
        if (file && file.path) {
          // 15 minutes
          downloadUrl = await getR2SignedUrl(file.path, 15 * 60);
        }

        return {
          name: item.name,
          variationName: item.variationId || undefined,
          price: parseFloat(item.price),
          downloadUrl,
        };
      })
    );

    // Render and send email
    const html = await render(
      PurchaseConfirmationEmail({
        customerName: order.email.split('@')[0] || 'Cliente',
        orderId: order.id,
        orderDate: new Date(order.createdAt).toLocaleDateString('pt-BR'),
        products,
        totalAmount: parseFloat(order.total),
      })
    );

    try {
      const resendResult = await resend.emails.send({
        from: FROM_EMAIL,
        to: order.email,
        subject: `✅ Pedido Confirmado #${order.id.slice(0, 8)} - A Rafa Criou`,
        html,
      });

      console.log(
        '📧 Reenvio de confirmação enviado para',
        order.email,
        'resendResult=',
        resendResult
      );

      // Return debug info: which products had download URLs and the resend SDK response (id/status)
      return NextResponse.json({
        ok: true,
        emailResult: resendResult,
        products: products.map(p => ({ name: p.name, hasUrl: !!p.downloadUrl })),
      });
    } catch (err) {
      console.error('Erro ao reenviar email de confirmação:', err);
      return NextResponse.json(
        { error: 'Failed to send email', details: String(err) },
        { status: 500 }
      );
    }
  } catch (err) {
    console.error('Erro em send-confirmation:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export const runtime = 'nodejs';
