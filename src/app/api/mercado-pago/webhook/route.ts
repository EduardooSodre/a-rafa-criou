import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

// Simples controle de idempotência (ideal: usar storage externo)
const processedEvents = new Set<string>();

/**
 * Valida a assinatura do webhook do Mercado Pago
 * Documentação: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
 */
function validateWebhookSignature(
  xSignature: string | null,
  xRequestId: string | null,
  dataId: string,
  secret: string
): boolean {
  if (!xSignature || !xRequestId || !secret) {
    console.warn('[Webhook] ⚠️ Headers ou secret ausentes para validação');
    return false;
  }

  try {
    // Extrair ts e hash da assinatura
    const parts = xSignature.split(',');
    let ts = '';
    let hash = '';
    
    for (const part of parts) {
      const [key, value] = part.split('=');
      if (key.trim() === 'ts') ts = value;
      if (key.trim() === 'v1') hash = value;
    }

    if (!ts || !hash) {
      console.warn('[Webhook] ⚠️ Formato de assinatura inválido');
      return false;
    }

    // Criar o manifesto: id + request-id + ts
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
    
    // Calcular HMAC SHA256
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(manifest);
    const calculatedHash = hmac.digest('hex');

    // Comparar hashes
    const isValid = calculatedHash === hash;
    
    if (!isValid) {
      console.error('[Webhook] ❌ Assinatura inválida!');
      console.log('[Webhook] Hash recebido:', hash);
      console.log('[Webhook] Hash calculado:', calculatedHash);
      console.log('[Webhook] Manifest usado:', manifest);
    } else {
      console.log('[Webhook] ✅ Assinatura validada com sucesso');
    }

    return isValid;
  } catch (error) {
    console.error('[Webhook] Erro ao validar assinatura:', error);
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('═══════════════════════════════════════════════════════');
    console.log('[Webhook Pix] PAYLOAD COMPLETO RECEBIDO:');
    console.log(JSON.stringify(body, null, 2));
    console.log('═══════════════════════════════════════════════════════');
    
    // Extrair payment ID de diferentes formatos possíveis
    let paymentId: string | null = null;
    
    // Formato 1: { data: { id: "123" } }
    if (body.data?.id) {
      paymentId = body.data.id;
    }
    // Formato 2: { id: "123" }
    else if (body.id && typeof body.id === 'string') {
      paymentId = body.id;
    }
    // Formato 3: { resource: "/v1/payments/123" }
    else if (body.resource && typeof body.resource === 'string') {
      const match = body.resource.match(/\/payments\/(\d+)/);
      if (match) {
        paymentId = match[1];
      }
    }

    if (!paymentId) {
      console.warn('[Webhook Pix] ⚠️ Não foi possível extrair payment ID do payload');
      console.log('[Webhook Pix] Body keys:', Object.keys(body));
      return NextResponse.json({ received: true, message: 'No payment ID found' });
    }

    console.log(`[Webhook Pix] 🔍 Payment ID extraído: ${paymentId}`);

    // ✅ VALIDAR ASSINATURA (se MERCADOPAGO_WEBHOOK_SECRET estiver configurado)
    const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    if (webhookSecret) {
      const xSignature = req.headers.get('x-signature');
      const xRequestId = req.headers.get('x-request-id');
      
      const isValid = validateWebhookSignature(
        xSignature,
        xRequestId,
        paymentId,
        webhookSecret
      );

      if (!isValid) {
        console.error('[Webhook] 🚫 Assinatura inválida - webhook rejeitado!');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 403 }
        );
      }
    } else {
      console.warn('[Webhook] ⚠️ MERCADOPAGO_WEBHOOK_SECRET não configurado - validação de assinatura desabilitada');
    }

    // Idempotência: não processar o mesmo evento duas vezes (dentro de 1 minuto)
    if (processedEvents.has(paymentId)) {
      console.log('[Webhook Pix] ⏭️ Evento duplicado (já processado), ignorando');
      return NextResponse.json({ status: 'duplicated' });
    }
    processedEvents.add(paymentId);
    // Limpar após 1 minuto para permitir novos webhooks do mesmo pagamento
    setTimeout(() => processedEvents.delete(paymentId), 60000);

    // SEMPRE consultar a API do Mercado Pago para garantir status correto
    if (paymentId) {
      console.log(`[Webhook] Consultando pagamento ${paymentId} no Mercado Pago...`);
      
      // Buscar status do pagamento diretamente da API do Mercado Pago
      try {
        const paymentResponse = await fetch(
          `https://api.mercadopago.com/v1/payments/${paymentId}`,
          {
            headers: {
              'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
            },
          }
        );

        if (!paymentResponse.ok) {
          throw new Error(`Erro ao buscar pagamento: ${paymentResponse.status}`);
        }

        const payment = await paymentResponse.json();
        console.log(`[Webhook] Status do pagamento ${paymentId}:`, payment.status);

        // Busca pedido pelo paymentId
        const [order] = await db
          .select()
          .from(orders)
          .where(eq(orders.paymentId, paymentId))
          .limit(1);

        if (order) {
          let newStatus = 'pending';
          let paymentStatus = 'pending';
          
          // Tratar status do Mercado Pago → IGUAL À STRIPE
          if (
            [
              'approved',
              'paid',
              'authorized',
            ].includes(payment.status)
          ) {
            newStatus = 'completed';
            paymentStatus = 'paid'; // ✅ IGUAL À STRIPE
          } else if (
            ['pending', 'in_process', 'in_mediation'].includes(payment.status)
          ) {
            newStatus = 'pending';
            paymentStatus = 'pending';
          } else if (
            ['cancelled', 'rejected', 'expired', 'charged_back'].includes(payment.status)
          ) {
            newStatus = 'cancelled';
            paymentStatus = 'cancelled';
          } else if (payment.status === 'refunded') {
            newStatus = 'refunded';
            paymentStatus = 'refunded';
          }

          await db
            .update(orders)
            .set({
              status: newStatus,
              paymentStatus: paymentStatus, // ✅ AGORA USA 'paid' em vez de 'approved'
              updatedAt: new Date(),
              paidAt: newStatus === 'completed' ? new Date() : order.paidAt,
            })
            .where(eq(orders.id, order.id));

          console.log(
            `[Webhook] Pedido ${order.id} atualizado: ${order.status} -> ${newStatus} (paymentStatus: ${paymentStatus})`
          );

          // Enviar e-mail de confirmação se o pedido foi completado
          if (newStatus === 'completed' && order.status !== 'completed') {
            console.log(`[Webhook] Enviando e-mail de confirmação para pedido ${order.id}`);
            try {
              await fetch(`${process.env.NEXTAUTH_URL}/api/orders/send-confirmation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: order.id }),
              });
            } catch (emailError) {
              console.error('[Webhook] Erro ao enviar e-mail:', emailError);
              // Não falhar o webhook se o e-mail falhar
            }
          }
        } else {
          console.warn(`[Webhook] Pedido não encontrado para paymentId: ${paymentId}`);
        }
      } catch (apiError) {
        console.error('[Webhook] Erro ao consultar API do Mercado Pago:', apiError);
        throw apiError;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Webhook] Erro:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
