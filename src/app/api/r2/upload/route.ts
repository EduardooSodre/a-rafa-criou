import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { uploadToR2, generateFileKey } from '@/lib/r2-utils';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Parse do FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo fornecido' }, { status: 400 });
    }

    // Validações do arquivo - THIS ENDPOINT IS PDF-ONLY. Images must be stored in DB.
    if (!file.type.includes('pdf')) {
      return NextResponse.json(
        { error: 'Tipo de arquivo não suportado. Apenas PDFs são permitidos neste endpoint.' },
        { status: 400 }
      );
    }

    // Gerar chave única para o arquivo
    const fileKey = generateFileKey(file.name);

    // Converter o arquivo para Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload para Cloudflare R2 usando as utils já funcionais
    await uploadToR2(fileKey, buffer, file.type);

    // URL pública do arquivo (será implementada quando necessário)
    const publicUrl = `${process.env.R2_PUBLIC_URL || ''}/${fileKey}`;

    console.log('R2 Upload Success:', {
      fileKey,
      originalName: file.name,
      size: file.size,
      type: file.type,
    });

    const response = {
      success: true,
      data: {
        key: fileKey,
        originalName: file.name,
        size: file.size,
        type: file.type,
        url: publicUrl,
      },
    };

    console.log('R2 Upload Success:', {
      key: fileKey,
      size: file.size,
      type: file.type,
      url: publicUrl,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Erro no upload para R2:', error);

    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';

    return NextResponse.json(
      {
        error: 'Erro interno do servidor durante o upload',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}

// Configuração para permitir arquivos grandes
export const runtime = 'nodejs';
export const maxDuration = 60; // 60 segundos para uploads grandes
