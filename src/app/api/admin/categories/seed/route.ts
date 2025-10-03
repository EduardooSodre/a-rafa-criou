import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { categories } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function POST() {
    try {
        console.log('🌱 Iniciando seed de categorias e subcategorias...')

        // Definir categorias principais com suas subcategorias
        const categoriesData = [
            {
                name: 'Cartas',
                slug: 'cartas',
                description: 'Cartas personalizadas para todas as ocasiões',
                subcategories: [
                    { name: 'Cartas de Amor', slug: 'cartas-amor' },
                    { name: 'Cartas de Aniversário', slug: 'cartas-aniversario' },
                    { name: 'Cartas de Agradecimento', slug: 'cartas-agradecimento' },
                    { name: 'Cartas de Natal', slug: 'cartas-natal' },
                ]
            },
            {
                name: 'Diversos',
                slug: 'diversos',
                description: 'Produtos variados e criativos',
                subcategories: [
                    { name: 'Calendários', slug: 'calendarios' },
                    { name: 'Planners', slug: 'planners' },
                    { name: 'Etiquetas', slug: 'etiquetas' },
                    { name: 'Agendas', slug: 'agendas' },
                ]
            },
            {
                name: 'Lembrancinhas',
                slug: 'lembrancinhas',
                description: 'Lembrancinhas especiais para seus eventos',
                subcategories: [
                    { name: 'Aniversário Infantil', slug: 'aniversario-infantil' },
                    { name: 'Chá de Bebê', slug: 'cha-bebe' },
                    { name: 'Casamento', slug: 'casamento' },
                    { name: 'Formatura', slug: 'formatura' },
                ]
            }
        ]

        const results = []

        for (const categoryData of categoriesData) {
            // Verificar se a categoria principal já existe
            const existingCategory = await db
                .select()
                .from(categories)
                .where(eq(categories.slug, categoryData.slug))
                .limit(1)

            let mainCategoryId: string

            if (existingCategory.length > 0) {
                mainCategoryId = existingCategory[0].id
                results.push(`✓ Categoria "${categoryData.name}" já existe`)
            } else {
                // Criar categoria principal
                const [insertedCategory] = await db
                    .insert(categories)
                    .values({
                        name: categoryData.name,
                        slug: categoryData.slug,
                        description: categoryData.description,
                        parentId: null,
                        sortOrder: 0,
                        isActive: true,
                    })
                    .returning()

                mainCategoryId = insertedCategory.id
                results.push(`✓ Categoria "${categoryData.name}" criada`)
            }

            // Criar subcategorias
            for (const subcat of categoryData.subcategories) {
                const existingSubcat = await db
                    .select()
                    .from(categories)
                    .where(eq(categories.slug, subcat.slug))
                    .limit(1)

                if (existingSubcat.length === 0) {
                    await db.insert(categories).values({
                        name: subcat.name,
                        slug: subcat.slug,
                        description: `${subcat.name} - ${categoryData.name}`,
                        parentId: mainCategoryId,
                        sortOrder: 0,
                        isActive: true,
                    })
                    results.push(`  ✓ Subcategoria "${subcat.name}" criada`)
                } else {
                    results.push(`  ✓ Subcategoria "${subcat.name}" já existe`)
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Seed de categorias concluído!',
            results
        })
    } catch (error) {
        console.error('❌ Erro ao fazer seed:', error)
        return NextResponse.json(
            { 
                success: false, 
                error: 'Erro ao fazer seed de categorias',
                details: error instanceof Error ? error.message : 'Erro desconhecido'
            },
            { status: 500 }
        )
    }
}
