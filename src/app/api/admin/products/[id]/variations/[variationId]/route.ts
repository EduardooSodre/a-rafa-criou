import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { productVariations, files } from '@/lib/db/schema';
import { products } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { productImages, variationAttributeValues } from '@/lib/db/schema';

const updateVariationSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  slug: z.string().min(1).max(255).optional(),
  price: z.number().min(0.01).optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; variationId: string }> }
) {
  try {
    const { id: productId, variationId } = await params;

    // Get variation
    const [variation] = await db
      .select()
      .from(productVariations)
      .where(eq(productVariations.id, variationId))
      .limit(1);

    if (!variation) {
      return NextResponse.json({ error: 'Variation not found' }, { status: 404 });
    }

    // Verify that variation belongs to the product
    if (variation.productId !== productId) {
      return NextResponse.json({ error: 'Variation not found' }, { status: 404 });
    }

    // Get related files, images and attribute mappings
    const variationFiles = await db.select().from(files).where(eq(files.variationId, variationId));
    const variationImages = await db
      .select()
      .from(productImages)
      .where(eq(productImages.variationId, variationId));
    const mappings = await db
      .select()
      .from(variationAttributeValues)
      .where(eq(variationAttributeValues.variationId, variationId));

    const attributeValues = mappings.map(m => ({ attributeId: m.attributeId, valueId: m.valueId }));

    const completeVariation = {
      ...variation,
      files: variationFiles.map(f => ({
        filename: f.name,
        originalName: f.originalName || f.name,
        fileSize: f.size,
        mimeType: f.mimeType || '',
        r2Key: f.path,
      })),
      images: variationImages.map(img => ({
        id: img.id,
        cloudinaryId: img.cloudinaryId,
        url: img.url,
        format: img.format || null,
        size: img.size || null,
        alt: img.alt,
        isMain: img.isMain,
        order: img.sortOrder,
      })),
      attributeValues,
    };

    return NextResponse.json(completeVariation);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; variationId: string }> }
) {
  try {
    const { id: productId, variationId } = await params;
    const body = await request.json();
    const validatedData = updateVariationSchema.parse(body);

    // Check if variation exists and belongs to the product
    const [existingVariation] = await db
      .select()
      .from(productVariations)
      .where(eq(productVariations.id, variationId))
      .limit(1);

    if (!existingVariation) {
      return NextResponse.json({ error: 'Variation not found' }, { status: 404 });
    }

    if (existingVariation.productId !== productId) {
      return NextResponse.json({ error: 'Variation not found' }, { status: 404 });
    }

    // Update variation
    const updateData: Partial<typeof productVariations.$inferInsert> = {};
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.slug !== undefined) updateData.slug = validatedData.slug;
    if (validatedData.price !== undefined) updateData.price = validatedData.price.toString();
    if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive;

    updateData.updatedAt = new Date();

    const [updatedVariation] = await db
      .update(productVariations)
      .set(updateData)
      .where(eq(productVariations.id, variationId))
      .returning();

    // Se for a variação principal (id === 1 ou ordem === 1), atualiza o preço do produto
    // Adapte conforme sua lógica de identificação da variação principal
    // Variação principal: sortOrder === 1 ou variationId === '1'
    if (variationId && (variationId === '1' || existingVariation.sortOrder === 1)) {
      if (validatedData.price !== undefined) {
        await db
          .update(products)
          .set({ price: validatedData.price.toString(), updatedAt: new Date() })
          .where(eq(products.id, productId));
      }
    }

    // Get updated variation with files
    const variationFiles = await db.select().from(files).where(eq(files.variationId, variationId));

    const completeVariation = {
      ...updatedVariation,
      files: variationFiles,
    };

    return NextResponse.json(completeVariation);
  } catch (error) {
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
  { params }: { params: Promise<{ id: string; variationId: string }> }
) {
  try {
    const { id: productId, variationId } = await params;

    // Check if variation exists and belongs to the product
    const [existingVariation] = await db
      .select()
      .from(productVariations)
      .where(eq(productVariations.id, variationId))
      .limit(1);

    if (!existingVariation) {
      return NextResponse.json({ error: 'Variation not found' }, { status: 404 });
    }

    if (existingVariation.productId !== productId) {
      return NextResponse.json({ error: 'Variation not found' }, { status: 404 });
    }

    // Delete related files first
    await db.delete(files).where(eq(files.variationId, variationId));

    // Delete variation
    await db.delete(productVariations).where(eq(productVariations.id, variationId));

    return NextResponse.json({ message: 'Variation deleted successfully' });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
