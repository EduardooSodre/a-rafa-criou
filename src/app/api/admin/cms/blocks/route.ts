import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { contentBlocks, contentVersions } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const body = await request.json()
        const { pageId, key, type, valueJson, sortOrder = 0 } = body

        const [newBlock] = await db
            .insert(contentBlocks)
            .values({
                pageId,
                key,
                type,
                valueJson,
                sortOrder,
                updatedAt: new Date(),
            })
            .returning()

        // Salvar versão
        await db.insert(contentVersions).values({
            blockId: newBlock.id,
            valueJson,
            savedBy: session.user.id,
            savedAt: new Date(),
        })

        return NextResponse.json(newBlock)
    } catch (error) {
        console.error('Erro ao criar bloco:', error)
        return NextResponse.json(
            { error: 'Erro ao criar bloco' },
            { status: 500 }
        )
    }
}

export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const body = await request.json()
        const { id, valueJson, type, key, sortOrder } = body

        const updateData: Record<string, unknown> = {
            updatedAt: new Date(),
        }

        if (valueJson !== undefined) updateData.valueJson = valueJson
        if (type !== undefined) updateData.type = type
        if (key !== undefined) updateData.key = key
        if (sortOrder !== undefined) updateData.sortOrder = sortOrder

        const [updated] = await db
            .update(contentBlocks)
            .set(updateData)
            .where(eq(contentBlocks.id, id))
            .returning()

        // Salvar versão se o conteúdo mudou
        if (valueJson !== undefined) {
            await db.insert(contentVersions).values({
                blockId: id,
                valueJson,
                savedBy: session.user.id,
                savedAt: new Date(),
            })
        }

        return NextResponse.json(updated)
    } catch (error) {
        console.error('Erro ao atualizar bloco:', error)
        return NextResponse.json(
            { error: 'Erro ao atualizar bloco' },
            { status: 500 }
        )
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: 'ID não fornecido' }, { status: 400 })
        }

        await db.delete(contentBlocks).where(eq(contentBlocks.id, id))

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Erro ao deletar bloco:', error)
        return NextResponse.json(
            { error: 'Erro ao deletar bloco' },
            { status: 500 }
        )
    }
}
