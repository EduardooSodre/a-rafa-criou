import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { deleteImageFromCloudinary, isCloudinaryConfigured } from '@/lib/cloudinary';

export const runtime = 'nodejs';

/**
 * DELETE /api/cloudinary/delete
 * Deleta uma imagem do Cloudinary
 * Requer autenticação de admin
 */
export async function DELETE(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verificar se Cloudinary está configurado
    if (!isCloudinaryConfigured()) {
      return NextResponse.json(
        {
          error: 'Cloudinary não configurado. Verifique as variáveis de ambiente.',
        },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const cloudinaryId = searchParams.get('cloudinaryId');

    // Validar dados
    if (!cloudinaryId) {
      return NextResponse.json({ error: 'cloudinaryId não fornecido' }, { status: 400 });
    }

    // Segurança: validar que o cloudinaryId pertence ao projeto (pasta a-rafa-criou)
    const allowedPrefix = process.env.CLOUDINARY_FOLDER || 'a-rafa-criou';
    if (!cloudinaryId.startsWith(allowedPrefix)) {
      return NextResponse.json(
        {
          error: 'ID inválido. Apenas imagens do projeto podem ser deletadas.',
        },
        { status: 403 }
      );
    }

    // Deletar do Cloudinary
    const success = await deleteImageFromCloudinary(cloudinaryId);

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Imagem deletada com sucesso',
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: 'Falha ao deletar imagem (pode já ter sido deletada)',
        },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Erro ao deletar imagem do Cloudinary:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Erro ao deletar imagem',
      },
      { status: 500 }
    );
  }
}
