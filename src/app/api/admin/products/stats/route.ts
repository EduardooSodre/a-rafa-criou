import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products } from '@/lib/db/schema';

export async function GET() {
  try {
    // Buscar todos os produtos para calcular estatísticas
    const allProducts = await db.select().from(products);

    const stats = {
      total: allProducts.length,
      active: allProducts.filter(p => p.isActive === true).length,
      inactive: allProducts.filter(p => p.isActive === false).length,
      revenue: allProducts.reduce((acc, p) => acc + parseFloat(p.price || '0'), 0),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Erro ao buscar estatísticas de produtos:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
