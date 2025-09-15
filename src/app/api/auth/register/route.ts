import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { randomUUID } from 'crypto'
import { eq } from 'drizzle-orm'

const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validar dados de entrada
    const validatedData = registerSchema.parse(body)
    const { name, email, password } = validatedData

    // Verificar se o usuário já existe
    const existingUserList = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    if (existingUserList.length > 0) {
      return NextResponse.json(
        { error: 'E-mail já está em uso' },
        { status: 400 }
      )
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 12)

    // Gerar ID único
    const userId = randomUUID()

    // Criar usuário
    const [newUser] = await db
      .insert(users)
      .values({
        id: userId,
        name,
        email,
        password: hashedPassword,
        role: 'customer', // Role padrão para novos usuários
        emailVerified: null, // Será verificado posteriormente se implementarmos verificação
      })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      })

    return NextResponse.json(
      {
        message: 'Usuário criado com sucesso',
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erro no registro:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}