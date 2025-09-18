import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

const promoteUserSchema = z.object({
  email: z.string().email(),
  action: z.enum(['promote', 'demote']),
  adminPassword: z.string().min(1) // Senha do admin atual para confirmar
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, action, adminPassword } = promoteUserSchema.parse(body)

    // Verificar se o admin atual tem permissão (validar senha)
    // Por segurança, vamos exigir que o admin atual digite sua senha
    const currentAdminEmail = 'admin@arafacriou.com.br' // ou pegar do token/session
    
    const [currentAdmin] = await db
      .select()
      .from(users)
      .where(eq(users.email, currentAdminEmail))
      .limit(1)

    if (!currentAdmin || currentAdmin.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verificar senha do admin atual
    const isValidPassword = await bcrypt.compare(adminPassword, currentAdmin.password || '')
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid admin password' }, { status: 401 })
    }

    // Buscar usuário para promover/demover
    const [targetUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const newRole = action === 'promote' ? 'admin' : 'customer'

    if (targetUser.role === newRole) {
      return NextResponse.json({ 
        message: `User ${email} is already ${newRole}` 
      })
    }

    // Atualizar role do usuário
    await db
      .update(users)
      .set({ 
        role: newRole,
        updatedAt: new Date()
      })
      .where(eq(users.email, email))

    return NextResponse.json({
      message: `User ${email} ${action === 'promote' ? 'promoted to' : 'demoted from'} admin`,
      user: {
        email: targetUser.email,
        name: targetUser.name,
        role: newRole
      }
    })

  } catch (error) {
    console.error('Error managing user role:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}