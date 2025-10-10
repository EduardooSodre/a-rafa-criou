/**
 * API APENAS PARA DESENVOLVIMENTO: Simular pagamento PIX
 * 
 * POST /api/stripe/simulate-pix-payment
 * Body: { paymentIntentId: string }
 * 
 * ⚠️ REMOVER EM PRODUÇÃO ou proteger com autenticação admin
 */

import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  // Bloquear em produção
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Esta rota não está disponível em produção' },
      { status: 403 }
    );
  }

  try {
    const { paymentIntentId } = await request.json();

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'paymentIntentId é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar Payment Intent para confirmar que existe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      return NextResponse.json({
        success: true,
        message: 'Payment Intent já foi confirmado',
        paymentIntent: {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency,
        },
      });
    }

    // Confirmar Payment Intent com método de teste
    // Em teste, usamos 'card' mas a metadata indica que é PIX
    const confirmed = await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: 'pm_card_visa', // Cartão de teste
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/obrigado`,
    });

    return NextResponse.json({
      success: true,
      message: 'Payment Intent confirmado com sucesso! O webhook processará automaticamente.',
      paymentIntent: {
        id: confirmed.id,
        status: confirmed.status,
        amount: confirmed.amount / 100,
        currency: confirmed.currency,
        metadata: confirmed.metadata,
      },
    });

  } catch (error) {
    console.error('Erro ao simular pagamento PIX:', error);
    return NextResponse.json(
      {
        error: 'Erro ao simular pagamento',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
