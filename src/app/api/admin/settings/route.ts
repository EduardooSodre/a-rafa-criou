import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { siteSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const settings = await db.select().from(siteSettings).limit(1);

    // Se não existir configurações, retornar valores padrão
    if (settings.length === 0) {
      return NextResponse.json({
        siteName: 'A Rafa Criou',
        siteDescription: 'E-commerce de PDFs educacionais',
        siteUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        supportEmail: process.env.SUPPORT_EMAIL || 'contato@arafacriou.com',
        pixEnabled: true,
        stripeEnabled: true,
        maintenanceMode: false,
        allowGuestCheckout: true,
        maxDownloadsPerProduct: 3,
        downloadLinkExpiration: 24,
        enableWatermark: false,
        metaTitle: '',
        metaDescription: '',
        metaKeywords: '',
        googleAnalyticsId: '',
        facebookPixelId: '',
      });
    }

    return NextResponse.json(settings[0]);
  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    return NextResponse.json({ error: 'Erro ao buscar configurações' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();

    // Verificar se já existe uma configuração
    const existing = await db.select().from(siteSettings).limit(1);

    if (existing.length === 0) {
      // Criar nova configuração
      const [newSettings] = await db
        .insert(siteSettings)
        .values({
          ...body,
          updatedAt: new Date(),
        })
        .returning();

      return NextResponse.json(newSettings);
    } else {
      // Atualizar configuração existente
      const [updated] = await db
        .update(siteSettings)
        .set({
          ...body,
          updatedAt: new Date(),
        })
        .where(eq(siteSettings.id, existing[0].id))
        .returning();

      return NextResponse.json(updated);
    }
  } catch (error) {
    console.error('Erro ao salvar configurações:', error);
    return NextResponse.json({ error: 'Erro ao salvar configurações' }, { status: 500 });
  }
}
