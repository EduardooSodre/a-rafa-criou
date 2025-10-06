import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { categories } from '@/lib/db/schema';
import { eq, isNull, asc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeSubcategories = searchParams.get('includeSubcategories') === 'true';

    if (includeSubcategories) {
      // Buscar todas as categorias
      const allCategories = await db
        .select()
        .from(categories)
        .where(eq(categories.isActive, true))
        .orderBy(asc(categories.sortOrder));

      // Separar categorias principais e subcategorias
      const mainCategories = allCategories.filter(cat => !cat.parentId);
      const subcategoriesMap = new Map<string, typeof allCategories>();

      // Agrupar subcategorias por categoria pai
      allCategories
        .filter(cat => cat.parentId)
        .forEach(sub => {
          if (!subcategoriesMap.has(sub.parentId!)) {
            subcategoriesMap.set(sub.parentId!, []);
          }
          subcategoriesMap.get(sub.parentId!)!.push(sub);
        });

      // Montar estrutura hierárquica
      const result = mainCategories.map(cat => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        sortOrder: cat.sortOrder,
        subcategories: subcategoriesMap.get(cat.id) || [],
      }));

      return NextResponse.json(result);
    } else {
      // Buscar apenas categorias principais
      const mainCategories = await db
        .select()
        .from(categories)
        .where(isNull(categories.parentId))
        .orderBy(asc(categories.sortOrder));

      return NextResponse.json(mainCategories);
    }
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar categorias' }, { status: 500 });
  }
}
