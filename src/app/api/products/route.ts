import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products, categories } from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const featured = searchParams.get('featured') === 'true';

    // Montar query base
    let whereClause = undefined;
    if (featured) {
      whereClause = eq(products.isFeatured, true);
    }

    // Buscar produtos do banco
    const dbProducts = await db
      .select()
      .from(products)
      .where(whereClause)
      .limit(limit)
      .offset(offset);

    // Buscar total para paginação
    const totalArr = await db.select({ count: products.id }).from(products).where(whereClause);
    const total = totalArr.length > 0 ? totalArr.length : 0;
    const hasMore = offset + limit < total;

    // Buscar categorias para mapear nome
    const categoryIds = dbProducts.map(p => p.categoryId).filter((id): id is string => !!id);
    const categoriesMap: Record<string, { id: string; name: string; slug: string }> = {};
    if (categoryIds.length > 0) {
      const cats = await db.select().from(categories).where(inArray(categories.id, categoryIds));
      cats.forEach(cat => {
        categoriesMap[cat.id] = cat;
      });
    }

    // Adaptar formato para o frontend
    const productsOut = dbProducts.map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      shortDescription: p.shortDescription,
      price: Number(p.price),
      priceDisplay: `R$ ${Number(p.price).toFixed(2).replace('.', ',')}`,
      categoryId: p.categoryId,
      category: p.categoryId ? categoriesMap[p.categoryId] || null : null,
      isFeatured: p.isFeatured,
      variations: [], // Adapte se quiser buscar variações
      mainImage: null, // Adapte se quiser buscar imagem
    }));

    return NextResponse.json({
      products: productsOut,
      pagination: {
        total,
        limit,
        offset,
        hasMore,
      },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
