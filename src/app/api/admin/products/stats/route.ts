import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products, productVariations } from '@/lib/db/schema';

export async function GET() {
  try {
    // Buscar todos os produtos para calcular estatísticas
    const allProducts = await db.select().from(products);
    
    // Buscar todas as variações para calcular preços reais
    const allVariations = await db.select().from(productVariations);
    
    // Criar um mapa de variações por produto
    const variationsByProduct = new Map<string, typeof allVariations>();
    allVariations.forEach(v => {
      if (!variationsByProduct.has(v.productId)) {
        variationsByProduct.set(v.productId, []);
      }
      variationsByProduct.get(v.productId)?.push(v);
    });
    
    // Calcular preço real de cada produto (considerando variações)
    let totalRevenue = 0;
    allProducts.forEach(p => {
      const variations = variationsByProduct.get(p.id) || [];
      if (variations.length > 0) {
        // Se tem variações, usar o menor preço das variações ativas
        const activeVariations = variations.filter(v => v.isActive);
        if (activeVariations.length > 0) {
          const minPrice = Math.min(...activeVariations.map(v => parseFloat(v.price || '0')));
          totalRevenue += minPrice;
        } else {
          // Se não tem variações ativas, usar o menor preço de todas
          const minPrice = Math.min(...variations.map(v => parseFloat(v.price || '0')));
          totalRevenue += minPrice;
        }
      } else {
        // Se não tem variações, usar o preço do produto
        totalRevenue += parseFloat(p.price || '0');
      }
    });

    const stats = {
      total: allProducts.length,
      active: allProducts.filter(p => p.isActive === true).length,
      inactive: allProducts.filter(p => p.isActive === false).length,
      revenue: totalRevenue,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
