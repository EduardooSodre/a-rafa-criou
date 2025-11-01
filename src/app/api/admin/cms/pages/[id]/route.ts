import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { contentPages } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const page = await db.query.contentPages.findFirst({
            where: eq(contentPages.id, params.id),
            with: {
                blocks: {
                    orderBy: (blocks: { sortOrder: unknown }, { asc }: { asc: (field: unknown) => unknown }) => [asc(blocks.sortOrder)],
                },
            },
        })

        if (!page) {
            return NextResponse.json({ error: 'Página não encontrada' }, { status: 404 })
        }

        return NextResponse.json(page)
    } catch (error) {
        console.error('Erro ao buscar página:', error)
        return NextResponse.json(
            { error: 'Erro ao buscar página' },
            { status: 500 }
        )
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const body = await request.json()

        const [updated] = await db
            .update(contentPages)
            .set({
                ...body,
                updatedBy: session.user.id,
                updatedAt: new Date(),
            })
            .where(eq(contentPages.id, params.id))
            .returning()

        return NextResponse.json(updated)
    } catch (error) {
        console.error('Erro ao atualizar página:', error)
        return NextResponse.json(
            { error: 'Erro ao atualizar página' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        await db.delete(contentPages).where(eq(contentPages.id, params.id))

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Erro ao deletar página:', error)
        return NextResponse.json(
            { error: 'Erro ao deletar página' },
            { status: 500 }
        )
    }
}
