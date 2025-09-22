import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { categories } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST() {
  try {
    // Default categories to ensure they exist
    const defaultCategories = [
      { name: 'Planners', slug: 'planner', description: 'Planners e organizadores digitais' },
      { name: 'Adesivos', slug: 'adesivos', description: 'Adesivos digitais para impressão' },
      { name: 'Etiquetas', slug: 'etiquetas', description: 'Etiquetas para organização' },
      { name: 'Agendas', slug: 'agenda', description: 'Agendas e calendários' },
      { name: 'Organização', slug: 'organizacao', description: 'Materiais de organização' },
    ];

    let inserted = 0;

    for (const category of defaultCategories) {
      // Check if category already exists
      const existing = await db
        .select()
        .from(categories)
        .where(eq(categories.slug, category.slug))
        .limit(1);

      if (existing.length === 0) {
        // Insert if doesn't exist
        await db.insert(categories).values({
          name: category.name,
          slug: category.slug,
          description: category.description,
          isActive: true,
          sortOrder: 0,
        });
        inserted++;
      }
    }

    // Return all categories
    const allCategories = await db.select().from(categories);
    return NextResponse.json({
      message: `Categories initialized successfully. ${inserted} categories added.`,
      categories: allCategories,
    });
  } catch (error) {
    console.error('Error initializing categories:', error);
    return NextResponse.json({ error: 'Failed to initialize categories' }, { status: 500 });
  }
}
