import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { contentPages } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const lang = searchParams.get('lang') || 'pt'

        // Buscar todas as páginas com seus blocos
        const pages = await db.query.contentPages.findMany({
            where: eq(contentPages.lang, lang),
            with: {
                blocks: {
                    orderBy: (blocks: { sortOrder: unknown }, { asc }: { asc: (field: unknown) => unknown }) => [asc(blocks.sortOrder)],
                },
            },
        })

        return NextResponse.json(pages)
    } catch (error) {
        console.error('Erro ao buscar páginas:', error)
        return NextResponse.json(
            { error: 'Erro ao buscar páginas' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const body = await request.json()
        const { slug, lang = 'pt', isActive = true } = body

        // Verificar se já existe
        const existing = await db.query.contentPages.findFirst({
            where: and(
                eq(contentPages.slug, slug),
                eq(contentPages.lang, lang)
            ),
        })

        if (existing) {
            return NextResponse.json(
                { error: 'Página já existe para este idioma' },
                { status: 400 }
            )
        }

        const [newPage] = await db
            .insert(contentPages)
            .values({
                slug,
                lang,
                isActive,
                updatedBy: session.user.id,
                updatedAt: new Date(),
            })
            .returning()

        return NextResponse.json(newPage)
    } catch (error) {
        console.error('Erro ao criar página:', error)
        return NextResponse.json(
            { error: 'Erro ao criar página' },
            { status: 500 }
        )
    }
}
