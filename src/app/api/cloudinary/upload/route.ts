import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { uploadImageToCloudinary, isCloudinaryConfigured } from '@/lib/cloudinary';

export const runtime = 'nodejs';

/**
 * POST /api/cloudinary/upload
 * Upload de imagem para Cloudinary
 * Requer autenticação de admin
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verificar se Cloudinary está configurado
    if (!isCloudinaryConfigured()) {
      console.error('Cloudinary não configurado. Variáveis faltando:', {
        cloudName: !!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
        apiKey: !!process.env.CLOUDINARY_API_KEY,
        apiSecret: !!process.env.CLOUDINARY_API_SECRET,
      });
      return NextResponse.json(
        {
          error: 'Cloudinary não configurado. Verifique as variáveis de ambiente.',
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { image, folder, filename } = body;

    // Validar dados
    if (!image) {
      return NextResponse.json({ error: 'Imagem não fornecida' }, { status: 400 });
    }

    // Validar tipo de pasta
    if (folder && folder !== 'products' && folder !== 'variations') {
      return NextResponse.json(
        { error: 'Pasta inválida. Use "products" ou "variations"' },
        { status: 400 }
      );
    }

    console.log('Iniciando upload para Cloudinary...', {
      folder: folder || 'products',
      hasFilename: !!filename,
      imageLength: image.length,
    });

    // Upload para Cloudinary
    const result = await uploadImageToCloudinary(image, {
      folder: folder || 'products',
      filename,
    });

    console.log('Upload concluído com sucesso:', result.publicId);

    return NextResponse.json({
      success: true,
      cloudinaryId: result.publicId,
      url: result.secureUrl,
      width: result.width,
      height: result.height,
      format: result.format,
      size: result.bytes,
    });
  } catch (error) {
    console.error('Erro no upload para Cloudinary:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro ao fazer upload da imagem';
    console.error('Detalhes do erro:', errorMessage);
    return NextResponse.json(
      {
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
