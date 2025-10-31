import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const paymentId = searchParams.get('paymentId');
  if (!paymentId) {
    return NextResponse.json({ error: 'paymentId obrigatório' }, { status: 400 });
  }
  const [order] = await db.select().from(orders).where(eq(orders.paymentId, paymentId)).limit(1);
  if (!order) {
    return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
  }
  return NextResponse.json({ status: order.status });
}
