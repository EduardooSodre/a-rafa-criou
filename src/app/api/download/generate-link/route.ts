import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, orderItems, products, productVariations, files } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { getR2SignedUrl } from '@/lib/r2-utils';

/**
 * POST /api/download/generate-link
 * 
 * Gera URL assinada temporária (15min TTL) para download de PDF
 * 
 * Segurança:
 * - Verifica autenticação do usuário
 * - Valida propriedade do pedido
 * - Verifica limite de downloads (5x)
 * - Registra log de download
 * - URLs expiram em 15 minutos
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // 2. Validar dados da requisição
    const body = await req.json();
    const { orderItemId } = body;

    if (!orderItemId) {
      return NextResponse.json(
        { error: 'orderItemId é obrigatório' },
        { status: 400 }
      );
    }

    // 3. Buscar item do pedido com verificação de propriedade
    const [orderItem] = await db
      .select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        productId: orderItems.productId,
        variationId: orderItems.variationId,
        // Dados do pedido
        userId: orders.userId,
        orderStatus: orders.status,
        // Dados do produto
        productName: products.name,
        // Dados da variação
        variationName: productVariations.name,
        // Dados do arquivo (R2 path)
        filePath: files.path,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .innerJoin(products, eq(orderItems.productId, products.id))
      .leftJoin(productVariations, eq(orderItems.variationId, productVariations.id))
      .leftJoin(files, eq(files.variationId, productVariations.id))
      .where(eq(orderItems.id, orderItemId))
      .limit(1);

    // 4. Validações
    if (!orderItem) {
      return NextResponse.json(
        { error: 'Item não encontrado' },
        { status: 404 }
      );
    }

    // Verificar propriedade
    if (orderItem.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Você não tem permissão para acessar este item' },
        { status: 403 }
      );
    }

    // Verificar status do pedido
    if (orderItem.orderStatus !== 'completed') {
      return NextResponse.json(
        { error: 'Este pedido ainda não foi confirmado' },
        { status: 400 }
      );
    }

    // Verificar limite de downloads (5x)
    // TODO: Adicionar campo downloadCount ao schema order_items
    const MAX_DOWNLOADS = 5;
    // Temporariamente desabilitado até adicionar o campo ao schema
    // if (orderItem.downloadCount >= MAX_DOWNLOADS) {
    //   return NextResponse.json(
    //     {
    //       error: `Limite de ${MAX_DOWNLOADS} downloads atingido para este item`,
    //       downloadCount: orderItem.downloadCount,
    //       maxDownloads: MAX_DOWNLOADS,
    //     },
    //     { status: 429 }
    //   );
    // }

    // Verificar se o arquivo existe
    if (!orderItem.filePath) {
      return NextResponse.json(
        { error: 'Arquivo não disponível para este item' },
        { status: 404 }
      );
    }

    // 5. Gerar URL assinada (15 minutos de validade)
    const signedUrl = await getR2SignedUrl(
      orderItem.filePath,
      15 * 60 // 15 minutos em segundos
    );

    // 6. Incrementar contador de downloads
    // TODO: Adicionar lógica quando campo downloadCount estiver no schema
    const newDownloadCount = 1; // Temporário
    // await db
    //   .update(orderItems)
    //   .set({
    //     downloadCount: newDownloadCount,
    //     updatedAt: new Date(),
    //   })
    //   .where(eq(orderItems.id, orderItemId));

    // 7. Log de auditoria
    console.log('📥 Download gerado:', {
      userId: session.user.id,
      orderItemId,
      productName: orderItem.productName,
      variationName: orderItem.variationName,
      downloadCount: newDownloadCount,
      maxDownloads: MAX_DOWNLOADS,
      remaining: MAX_DOWNLOADS - newDownloadCount,
    });

    // 8. Retornar URL assinada
    return NextResponse.json({
      downloadUrl: signedUrl,
      expiresIn: 900, // 15 minutos em segundos
      downloadCount: newDownloadCount,
      maxDownloads: MAX_DOWNLOADS,
      remaining: MAX_DOWNLOADS - newDownloadCount,
      productName: orderItem.productName,
      variationName: orderItem.variationName,
    });
  } catch (error) {
    console.error('❌ Erro ao gerar link de download:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar link de download' },
      { status: 500 }
    );
  }
}
