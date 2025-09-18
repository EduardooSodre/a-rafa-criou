import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { categories } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'

// GET /api/admin/categories - Listar categorias
export async function GET() {
  try {
    const categoriesList = await db.select().from(categories).orderBy(desc(categories.createdAt))

    return NextResponse.json({
      categories: categoriesList,
      total: categoriesList.length
    })
  } catch (error) {
    console.error('Erro ao buscar categorias:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST /api/admin/categories - Criar categoria
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description } = body

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Nome da categoria é obrigatório' },
        { status: 400 }
      )
    }

    // Gerar slug
    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()

    // Verificar se slug já existe
    const existingCategory = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1)
    
    if (existingCategory.length > 0) {
      return NextResponse.json(
        { error: 'Já existe uma categoria com este nome' },
        { status: 400 }
      )
    }

    const [newCategory] = await db.insert(categories).values({
      name: name.trim(),
      slug,
      description: description?.trim() || null,
    }).returning()

    return NextResponse.json(newCategory, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar categoria:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}