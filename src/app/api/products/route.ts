import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products, categories, productVariations, productImages } from '@/lib/db/schema';

type VariationDb = {
  id: string;
  productId: string;
  name: string;
  slug: string;
  price: string | number;
  isActive: boolean;
  sortOrder: number;
};

type ImageDb = {
  id: string;
  productId: string;
  variationId?: string;
  data: string;
  alt?: string;
  isMain?: boolean;
};
import { eq, inArray, desc, like, or, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const featured = searchParams.get('featured') === 'true';
    const search = searchParams.get('search');

    // Montar query base
    const whereClauses = [];
    
    if (featured) {
      whereClauses.push(eq(products.isFeatured, true));
    }
    
    if (search && search.trim()) {
      whereClauses.push(
        or(
          like(products.name, `%${search}%`),
          like(products.description, `%${search}%`),
          like(products.shortDescription, `%${search}%`)
        )
      );
    }

    const whereClause = whereClauses.length > 0 
      ? whereClauses.length === 1 
        ? whereClauses[0] 
        : and(...whereClauses)
      : undefined;

    // Buscar produtos do banco (ordenado por mais recentes)
    const dbProducts = await db
      .select()
      .from(products)
      .where(whereClause)
      .orderBy(desc(products.createdAt))
      .limit(limit)
      .offset(offset);

    // Buscar variações de todos os produtos retornados
    const productIds = dbProducts.map(p => p.id);
    let allVariations: VariationDb[] = [];
    if (productIds.length > 0) {
      const rawVariations = await db
        .select()
        .from(productVariations)
        .where(inArray(productVariations.productId, productIds));
      allVariations = rawVariations.map(v => ({
        id: v.id,
        productId: v.productId!,
        name: v.name,
        slug: v.slug,
        price: v.price,
        isActive: v.isActive,
        sortOrder: v.sortOrder ?? 0,
      }));
    }

    // Buscar todas as imagens de todos os produtos
    let allImages: ImageDb[] = [];
    if (productIds.length > 0) {
      const rawImages = await db
        .select()
        .from(productImages)
        .where(inArray(productImages.productId, productIds));
      allImages = rawImages.map(img => ({
        id: img.id,
        productId: img.productId!,
        variationId: img.variationId || undefined,
        data: img.data,
        alt: img.alt || undefined,
        isMain: !!img.isMain,
      }));
    }

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
    const productsOut = dbProducts.map(p => {
      // Variações deste produto
      const variations = allVariations
        .filter(v => v.productId === p.id)
        .map(v => ({
          id: v.id,
          name: v.name,
          slug: v.slug,
          price: Number(v.price),
          isActive: v.isActive,
          sortOrder: v.sortOrder,
        }));

      // Todas as imagens deste produto
      const images = allImages.filter(img => img.productId === p.id);
      // Imagem principal: prioriza isMain, senão pega a primeira
      const mainImageObj = images.find(img => img.isMain) || images[0];

      return {
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
        createdAt: p.createdAt,
        variations,
        mainImage: mainImageObj
          ? {
              data: (function () {
                const raw = mainImageObj.data || '';
                if (String(raw).startsWith('data:')) return String(raw);
                // Assume DB-stored raw is base64 and build data URI
                return `data:image/jpeg;base64,${String(raw)}`;
              })(),
              alt: mainImageObj.alt || p.name,
            }
          : null,
        images: images.map(img => ({
          data: (function () {
            const raw = img.data || '';
            if (String(raw).startsWith('data:')) return String(raw);
            return `data:image/jpeg;base64,${String(raw)}`;
          })(),
          alt: img.alt || p.name,
        })),
      };
    });

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
