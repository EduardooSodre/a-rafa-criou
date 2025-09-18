import { NextRequest, NextResponse } from 'next/server';
import { uploadToR2, generateFileKey, isValidPDF, fileToBuffer } from '@/lib/r2-utils';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    // Validar se é PDF
    if (!isValidPDF(file)) {
      return NextResponse.json({ error: 'Apenas arquivos PDF são permitidos' }, { status: 400 });
    }

    // Validar tamanho (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'Arquivo muito grande. Máximo 50MB' }, { status: 400 });
    }

    // Gerar chave única
    const fileKey = generateFileKey(file.name);

    // Converter para Buffer
    const buffer = await fileToBuffer(file);

    // Upload para R2
    await uploadToR2(fileKey, buffer, 'application/pdf');

    return NextResponse.json({
      success: true,
      message: 'Arquivo enviado com sucesso!',
      fileKey,
      originalName: file.name,
      size: file.size,
    });
  } catch (error) {
    console.error('Erro no upload:', error);

    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
