import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, orderItems } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

const MERCADOPAGO_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN!;

export async function POST(req: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: 'ID do pedido é obrigatório' }, { status: 400 });
    }

    // Buscar o pedido
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId));

    if (!order) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
    }

    // Verificar se o pedido pertence ao usuário
    if (order.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Você não tem permissão para acessar este pedido' },
        { status: 403 }
      );
    }

    // Verificar se o pedido está pendente
    if (order.status !== 'pending') {
      return NextResponse.json({ error: 'Este pedido não está mais pendente' }, { status: 400 });
    }

    // Verificar se é pagamento via Mercado Pago
    if (order.paymentProvider !== 'mercado_pago') {
      return NextResponse.json({ error: 'Este pedido não foi criado via Pix' }, { status: 400 });
    }

    // Buscar itens do pedido
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Nenhum item encontrado no pedido' }, { status: 404 });
    }

    // Criar novo pagamento Pix no Mercado Pago
    const pixPayload = {
      transaction_amount: Number(order.total),
      description: `Pedido #${order.id.slice(0, 13)}`,
      payment_method_id: 'pix',
      payer: {
        email: order.email,
      },
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/mercado-pago/webhook`,
    };

    console.log('🔄 Regenerando Pix para pedido:', orderId);
    console.log('💰 Valor:', order.total);

    const pixResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(pixPayload),
    });

    const pixData = await pixResponse.json();

    if (!pixResponse.ok) {
      console.error('❌ Erro ao criar pagamento Pix:', pixData);
      throw new Error(pixData.message || 'Erro ao criar pagamento Pix');
    }

    console.log('✅ Pix gerado com sucesso:', pixData.id);

    // Atualizar o pedido com o novo payment_id
    await db
      .update(orders)
      .set({
        paymentId: pixData.id.toString(),
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    // Retornar dados do Pix
    return NextResponse.json({
      qrCode: pixData.point_of_interaction.transaction_data.qr_code,
      qrCodeBase64: pixData.point_of_interaction.transaction_data.qr_code_base64,
      paymentId: pixData.id,
      orderId: order.id,
    });
  } catch (error) {
    console.error('❌ Erro ao regenerar Pix:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Erro ao regenerar Pix',
      },
      { status: 500 }
    );
  }
}
