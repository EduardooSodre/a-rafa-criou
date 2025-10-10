/**
 * API: Verifica    // B
    // Buscar Payment Intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    return NextResponse.json({ent Intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    return NextResponse.json({
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      metadata: paymentIntent.metadata,
    });ment Intent
 * 
 * GET /api/stripe/payment-status?id=pi_xxx
 */

import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const paymentIntentId = searchParams.get('id');

    if (!paymentIntentId) {
      return NextResponse.json({ error: 'Payment Intent ID não fornecido' }, { status: 400 });
    }

    // Buscar Payment Intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Log apenas se status mudou (não succeeded ainda)
    if (paymentIntent.status !== 'requires_payment_method') {
      console.log('� Payment Intent:', paymentIntentId, '- Status:', paymentIntent.status);
    }

    return NextResponse.json({
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      metadata: paymentIntent.metadata,
    });
  } catch (error) {
    console.error('Erro ao verificar status:', error);
    return NextResponse.json(
      {
        error: 'Erro ao verificar status do pagamento',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
