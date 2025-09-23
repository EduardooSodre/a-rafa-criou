import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { categories, products, productVariations, productImages } from '@/lib/db/schema';

// Configuração do banco de dados
const connection = postgres(process.env.DATABASE_URL!, { max: 1 });
const db = drizzle(connection);

async function seedProducts() {
  console.log('🌱 Iniciando seed dos produtos...');

  try {
    // Criar categorias
    const categoryData = [
      {
        name: 'Planners',
        slug: 'planners',
        description: 'Planners para organização pessoal',
      },
      {
        name: 'Calendários',
        slug: 'calendarios',
        description: 'Calendários organizacionais',
      },
      {
        name: 'Templates',
        slug: 'templates',
        description: 'Templates diversos para organização',
      },
    ];

    const insertedCategories = await db
      .insert(categories)
      .values(categoryData)
      .returning()
      .onConflictDoNothing();

    console.log(`✅ ${insertedCategories.length} categorias criadas`);

    // Produtos de exemplo
    const productData = [
      {
        name: 'Planner Digital 2024',
        slug: 'planner-digital-2024',
        description:
          'Planner completo para organização anual com páginas mensais, semanais e diárias.',
        shortDescription: 'Planner completo para organização anual',
        price: '29.90',
        categoryId: insertedCategories[0]?.id || null,
        isFeatured: true,
        isActive: true,
      },
      {
        name: 'Calendário Minimalista',
        slug: 'calendario-minimalista',
        description: 'Calendário com design limpo e minimalista para quem busca simplicidade.',
        shortDescription: 'Design limpo e minimalista',
        price: '15.90',
        categoryId: insertedCategories[1]?.id || null,
        isFeatured: true,
        isActive: true,
      },
      {
        name: 'Kit Organização Pessoal',
        slug: 'kit-organizacao-pessoal',
        description:
          'Kit completo com diversos templates para organização da vida pessoal e profissional.',
        shortDescription: 'Kit completo para organização',
        price: '45.90',
        categoryId: insertedCategories[2]?.id || null,
        isFeatured: true,
        isActive: true,
      },
      {
        name: 'Agenda Semanal Colorida',
        slug: 'agenda-semanal-colorida',
        description: 'Agenda semanal com cores vibrantes para tornar o planejamento mais alegre.',
        shortDescription: 'Agenda semanal com cores vibrantes',
        price: '19.90',
        categoryId: insertedCategories[0]?.id || null,
        isFeatured: false,
        isActive: true,
      },
      {
        name: 'Template de Estudos',
        slug: 'template-estudos',
        description: 'Template especial para organização de estudos e cronogramas acadêmicos.',
        shortDescription: 'Organização de estudos e cronogramas',
        price: '24.90',
        categoryId: insertedCategories[2]?.id || null,
        isFeatured: true,
        isActive: true,
      },
      {
        name: 'Calendário de Metas',
        slug: 'calendario-metas',
        description:
          'Calendário focado no acompanhamento e alcance de metas pessoais e profissionais.',
        shortDescription: 'Acompanhamento de metas',
        price: '22.90',
        categoryId: insertedCategories[1]?.id || null,
        isFeatured: false,
        isActive: true,
      },
    ];

    const insertedProducts = await db
      .insert(products)
      .values(productData)
      .returning()
      .onConflictDoNothing();

    console.log(`✅ ${insertedProducts.length} produtos criados`);

    // Criar variações para alguns produtos
    for (const product of insertedProducts) {
      if (product.name.includes('Kit') || product.name.includes('Planner')) {
        const variationData = [
          {
            productId: product.id,
            name: 'Versão Básica',
            slug: `${product.slug}-basica`,
            price: product.price,
            isActive: true,
          },
          {
            productId: product.id,
            name: 'Versão Premium',
            slug: `${product.slug}-premium`,
            price: (parseFloat(product.price) + 10).toString(),
            isActive: true,
          },
        ];

        await db.insert(productVariations).values(variationData).onConflictDoNothing();
      }
    }

    console.log('✅ Variações criadas para produtos selecionados');

    // Adicionar imagens placeholder para os produtos
    for (const product of insertedProducts) {
      const imageData = {
        productId: product.id,
        name: 'Imagem Principal',
        originalName: 'banner_categorias.webp',
        mimeType: 'image/webp',
        size: 1024,
        data: '/banner_categorias.webp', // Usando uma imagem existente como placeholder
        alt: `Imagem do ${product.name}`,
        sortOrder: 1,
        isMain: true,
      };

      await db.insert(productImages).values(imageData).onConflictDoNothing();
    }

    console.log('✅ Imagens placeholder adicionadas');

    console.log('🎉 Seed concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro durante o seed:', error);
  } finally {
    await connection.end();
  }
}

seedProducts();
