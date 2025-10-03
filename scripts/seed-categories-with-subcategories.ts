import 'dotenv/config'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { categories } from '../src/lib/db/schema'
import { eq } from 'drizzle-orm'

const connectionString = process.env.DATABASE_URL!

async function seedCategoriesWithSubcategories() {
    console.log('🌱 Iniciando seed de categorias e subcategorias...')

    const client = postgres(connectionString)
    const db = drizzle(client)

    try {
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
                console.log(`✓ Categoria "${categoryData.name}" já existe`)
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
                console.log(`✓ Categoria "${categoryData.name}" criada`)
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
                    console.log(`  ✓ Subcategoria "${subcat.name}" criada`)
                } else {
                    console.log(`  ✓ Subcategoria "${subcat.name}" já existe`)
                }
            }
        }

        console.log('✅ Seed de categorias e subcategorias concluído!')
        await client.end()
    } catch (error) {
        console.error('❌ Erro ao fazer seed:', error)
        await client.end()
        throw error
    }
}

seedCategoriesWithSubcategories()
    .then(() => {
        console.log('🎉 Processo concluído!')
        process.exit(0)
    })
    .catch((error) => {
        console.error('💥 Erro fatal:', error)
        process.exit(1)
    })
