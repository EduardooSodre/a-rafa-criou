import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se o usuário atual é admin
    const currentUser = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (!currentUser[0] || currentUser[0].role !== 'admin') {
      return NextResponse.json(
        { error: 'Acesso negado - apenas administradores' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, action, adminPassword } = body;

    if (!email || !action || !adminPassword) {
      return NextResponse.json({ error: 'Email, ação e senha são obrigatórios' }, { status: 400 });
    }

    if (!['promote', 'demote'].includes(action)) {
      return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
    }

    // Verificar senha do admin atual
    const isPasswordValid = await bcrypt.compare(adminPassword, currentUser[0].password || '');

    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Senha de administrador incorreta' }, { status: 401 });
    }

    // Encontrar usuário alvo
    const targetUser = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (!targetUser[0]) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Verificar se não está tentando alterar o próprio role
    if (targetUser[0].email === session.user.email) {
      return NextResponse.json(
        { error: 'Não é possível alterar seu próprio role' },
        { status: 400 }
      );
    }

    // Verificar se não está tentando alterar o admin principal
    if (targetUser[0].email === 'admin@arafacriou.com.br') {
      return NextResponse.json(
        { error: 'Não é possível alterar o role do administrador principal' },
        { status: 400 }
      );
    }

    // Executar ação
    const newRole = action === 'promote' ? 'admin' : 'user';

    await db
      .update(users)
      .set({
        role: newRole,
        updatedAt: new Date(),
      })
      .where(eq(users.email, email));

    const actionText =
      action === 'promote' ? 'promovido a administrador' : 'rebaixado a usuário comum';

    return NextResponse.json({
      success: true,
      message: `Usuário ${targetUser[0].name || email} foi ${actionText} com sucesso`,
    });
  } catch {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
