import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { orders } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Simples controle de idempotência (ideal: usar storage externo)
const processedEvents = new Set<string>();

const WebhookSchema = z.object({
  id: z.string(),
  type: z.string(),
  data: z.object({
    id: z.string(),
    status: z.string().optional(),
    // outros campos conforme payload Mercado Pago
  }),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('[Webhook] Payload recebido:', JSON.stringify(body));
    const parsed = WebhookSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 });
    }
    const { id, type, data } = parsed.data;

    // Idempotência: não processar o mesmo evento duas vezes
    if (processedEvents.has(id)) {
      return NextResponse.json({ status: 'duplicated' });
    }
    processedEvents.add(id);

    // Logging
    console.log(`[Webhook] Evento recebido: ${type}, id: ${id}`);

    // Atualizar status do pedido no banco, nunca apagar/remover
    if (
      ['payment.updated', 'payment.created', 'payment.finished'].includes(type) &&
      data.id &&
      data.status
    ) {
      // Log detalhado do status recebido
      console.log(`[Webhook] Status recebido do Mercado Pago: ${data.status}`);
      // Busca pedido pelo paymentId
      const [order] = await db.select().from(orders).where(eq(orders.paymentId, data.id)).limit(1);
      if (order) {
        let newStatus = 'pending';
        // Tratar mais status que indicam pagamento aprovado
        if (
          [
            'approved',
            'paid',
            'authorized',
            'in_process',
            'in_mediation',
            'partially_approved',
          ].includes(data.status)
        ) {
          newStatus = 'completed';
        } else if (['cancelled', 'rejected', 'expired', 'charged_back'].includes(data.status)) {
          newStatus = 'cancelled';
        } else if (data.status === 'refunded') {
          newStatus = 'refunded';
        } else {
          newStatus = data.status;
        }
        await db
          .update(orders)
          .set({
            status: newStatus,
            paymentStatus: data.status,
            updatedAt: new Date(),
            paidAt: newStatus === 'completed' ? new Date() : null,
          })
          .where(eq(orders.id, order.id));
        console.log(`[Webhook] Pedido ${order.id} atualizado para status: ${newStatus}`);
      } else {
        console.warn(`[Webhook] Pedido não encontrado para paymentId: ${data.id}`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Webhook] Erro:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
