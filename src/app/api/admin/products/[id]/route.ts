import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { products, files } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const updateProductSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  slug: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  shortDescription: z.string().optional().nullable(),
  price: z.number().min(0.01).optional(),
  categoryId: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  seoTitle: z.string().optional().nullable(),
  seoDescription: z.string().optional().nullable(),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Get product
    const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Get related files
    const productFiles = await db.select().from(files).where(eq(files.productId, id));

    const completeProduct = {
      ...product,
      files: productFiles,
    };

    return NextResponse.json(completeProduct);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateProductSchema.parse(body);

    // Check if product exists
    const [existingProduct] = await db.select().from(products).where(eq(products.id, id)).limit(1);

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Update product
    const updateData: Partial<typeof products.$inferInsert> = {};
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.slug !== undefined) updateData.slug = validatedData.slug;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.shortDescription !== undefined)
      updateData.shortDescription = validatedData.shortDescription;
    if (validatedData.price !== undefined) updateData.price = validatedData.price.toString();
    if (validatedData.categoryId !== undefined) updateData.categoryId = validatedData.categoryId;
    if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive;
    if (validatedData.isFeatured !== undefined) updateData.isFeatured = validatedData.isFeatured;
    if (validatedData.seoTitle !== undefined) updateData.seoTitle = validatedData.seoTitle;
    if (validatedData.seoDescription !== undefined)
      updateData.seoDescription = validatedData.seoDescription;

    updateData.updatedAt = new Date();

    const [updatedProduct] = await db
      .update(products)
      .set(updateData)
      .where(eq(products.id, id))
      .returning();

    // Get updated product with files
    const productFiles = await db.select().from(files).where(eq(files.productId, id));

    const completeProduct = {
      ...updatedProduct,
      files: productFiles,
    };

    return NextResponse.json(completeProduct);
  } catch (error) {
    console.error('Error updating product:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if product exists
    const [existingProduct] = await db.select().from(products).where(eq(products.id, id)).limit(1);

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Delete related files first
    await db.delete(files).where(eq(files.productId, id));

    // Delete product
    await db.delete(products).where(eq(products.id, id));

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
