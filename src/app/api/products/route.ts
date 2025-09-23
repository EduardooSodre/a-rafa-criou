import { NextRequest, NextResponse } from 'next/server';
import { mockProducts } from '@/lib/mock-data';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const featured = searchParams.get('featured') === 'true';

    // Filtrar produtos em destaque se solicitado
    let filteredProducts = mockProducts;
    if (featured) {
      filteredProducts = mockProducts.filter(product => product.isFeatured);
    }

    // Aplicar paginação
    const paginatedProducts = filteredProducts.slice(offset, offset + limit);
    const total = filteredProducts.length;
    const hasMore = offset + limit < total;

    return NextResponse.json({
      products: paginatedProducts,
      pagination: {
        total,
        limit,
        offset,
        hasMore
      }
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}