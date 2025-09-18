import { NextRequest, NextResponse } from 'next/server';
import { getR2SignedUrl } from '@/lib/r2-utils';

export async function POST(request: NextRequest) {
  try {
    const { fileKey, expiresInSeconds } = await request.json();

    if (!fileKey) {
      return NextResponse.json({ error: 'fileKey é obrigatório' }, { status: 400 });
    }

    // Gerar URL assinada (padrão 1 hora, máximo 24 horas)
    const expires = Math.min(expiresInSeconds || 3600, 86400);
    const signedUrl = await getR2SignedUrl(fileKey, expires);

    return NextResponse.json({
      success: true,
      signedUrl,
      expiresIn: expires,
      expiresAt: new Date(Date.now() + expires * 1000).toISOString(),
    });
  } catch (error) {
    console.error('Erro ao gerar URL assinada:', error);

    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
