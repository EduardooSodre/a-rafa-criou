import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

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

    // Exemplo: atualizar pedido no banco (implementar lógica real)
    if (type === 'payment.updated' && data.status === 'approved') {
      // TODO: atualizar pedido como pago
      console.log(`[Webhook] Pagamento aprovado: ${data.id}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Webhook] Erro:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
