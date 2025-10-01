import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { deleteFromR2 } from '@/lib/r2-utils';

export async function DELETE(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Obter r2Key da query string
    const { searchParams } = new URL(request.url);
    const r2Key = searchParams.get('r2Key');

    if (!r2Key) {
      return NextResponse.json(
        { error: 'r2Key é obrigatório' },
        { status: 400 }
      );
    }

    // Validação básica: não permitir tentativas de path traversal
    // Bloquear "../" ou "/.." (path traversal real)
    // Mas permitir ".." no nome do arquivo (ex: "arquivo..pdf")
    if (r2Key.includes('../') || r2Key.includes('/..') || r2Key.startsWith('/') || r2Key.trim() === '') {
      return NextResponse.json(
        { error: 'r2Key inválido: contém caracteres não permitidos' },
        { status: 400 }
      );
    }

    // Validação adicional: garantir que é um path válido do R2
    // Deve começar com "products/" ou "pdfs/"
    if (!r2Key.startsWith('products/') && !r2Key.startsWith('pdfs/')) {
      return NextResponse.json(
        { error: 'r2Key inválido: deve começar com products/ ou pdfs/' },
        { status: 400 }
      );
    }

    // Deletar do R2
    await deleteFromR2(r2Key);

    console.log('R2 Delete Success:', {
      r2Key,
      deletedBy: session.user.email || session.user.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Arquivo deletado com sucesso',
      data: { r2Key },
    });
  } catch (error) {
    console.error('Erro ao deletar do R2:', error);

    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';

    // Se o erro for "Not Found", retornar 404
    if (errorMessage.includes('NotFound') || errorMessage.includes('NoSuchKey')) {
      return NextResponse.json(
        {
          error: 'Arquivo não encontrado no R2',
          details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        error: 'Erro interno do servidor ao deletar arquivo',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
