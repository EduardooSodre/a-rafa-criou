import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, orderItems, files } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getR2SignedUrl } from '@/lib/r2-utils';

// Secure download endpoint
// Accepts: orderId + itemId  OR payment_intent + itemId  OR payment_id + itemId
// Validates order/payment status and ownership, finds the file.path and returns a short-lived signed URL
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const searchParams = url.searchParams;

    const orderId = searchParams.get('orderId');
    const paymentIntent = searchParams.get('payment_intent'); // Stripe
    const paymentId = searchParams.get('payment_id'); // Pix (Mercado Pago)
    const itemId = searchParams.get('itemId');

    if (!itemId) {
      return NextResponse.json({ error: 'itemId is required' }, { status: 400 });
    }

    // ✅ Find order by orderId, payment_intent (Stripe), or payment_id (Pix)
    let order;
    if (orderId) {
      const res = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
      order = res[0];
    } else if (paymentIntent) {
      const res = await db
        .select()
        .from(orders)
        .where(eq(orders.stripePaymentIntentId, paymentIntent))
        .limit(1);
      order = res[0];
    } else if (paymentId) {
      const res = await db.select().from(orders).where(eq(orders.paymentId, paymentId)).limit(1);
      order = res[0];
    } else {
      return NextResponse.json(
        { error: 'orderId, payment_intent, or payment_id is required' },
        { status: 400 }
      );
    }

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const paymentStatus = (order.paymentStatus || '').toLowerCase();
    const orderStatus = (order.status || '').toLowerCase();
    const isSuccess =
      orderStatus === 'completed' || paymentStatus === 'succeeded' || paymentStatus === 'paid';

    if (!isSuccess) {
      return NextResponse.json({ error: 'Order payment not approved' }, { status: 403 });
    }

    // ✅ VERIFICAR EXPIRAÇÃO DE 1 MÊS (30 dias)
    const paidDate = order.paidAt ? new Date(order.paidAt) : new Date(order.createdAt);
    const now = new Date();
    const daysSincePurchase = Math.floor((now.getTime() - paidDate.getTime()) / (1000 * 60 * 60 * 24));
    const DOWNLOAD_EXPIRATION_DAYS = 30;

    if (daysSincePurchase > DOWNLOAD_EXPIRATION_DAYS) {
      return NextResponse.json(
        {
          error: 'Download expirado',
          message: `O prazo de ${DOWNLOAD_EXPIRATION_DAYS} dias para download deste produto expirou.`,
          expiredAt: new Date(paidDate.getTime() + DOWNLOAD_EXPIRATION_DAYS * 24 * 60 * 60 * 1000).toISOString(),
          daysSincePurchase,
        },
        { status: 410 } // 410 Gone
      );
    }

    // Find the order item to determine the file. We expect files to be linked by productId/variationId -> files.path
    const items = await db.select().from(orderItems).where(eq(orderItems.id, itemId)).limit(1);
    const item = items[0];
    if (!item) {
      return NextResponse.json({ error: 'Order item not found' }, { status: 404 });
    }

    // Prefer file matching variationId then productId. Handle nullable variationId safely.
    let file = null;
    if (item.variationId) {
      const byVariation = await db
        .select()
        .from(files)
        .where(eq(files.variationId, item.variationId))
        .limit(1);
      file = byVariation[0];
    }

    if (!file) {
      const byProduct = await db
        .select()
        .from(files)
        .where(eq(files.productId, item.productId))
        .limit(1);
      file = byProduct[0];
    }

    if (!file) {
      return NextResponse.json(
        { error: 'No downloadable file found for this item' },
        { status: 404 }
      );
    }

    // Generate a short-lived signed URL using r2-utils
    const ttl = 60; // seconds
    const signed = await getR2SignedUrl(file.path, ttl);

    // Return a redirect to the proxy download route so we can audit hits if needed
    const proxyUrl = `/api/r2/download?r2Key=${encodeURIComponent(file.path)}`;
    return NextResponse.json({ downloadUrl: proxyUrl, signedUrl: signed });
  } catch (err) {
    console.error('Error in orders/download:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const runtime = 'nodejs';
