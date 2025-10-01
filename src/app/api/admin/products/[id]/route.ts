import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { products, files } from '@/lib/db/schema';
import { variationAttributeValues } from '@/lib/db/schema';
import { productAttributes } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { productImages, productVariations } from '@/lib/db/schema';

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

// Incoming shapes from client
type IncomingImage = {
  data?: string | null;
  alt?: string | null;
  isMain?: boolean;
  order?: number;
};
type IncomingFile = {
  filename: string;
  originalName?: string | null;
  fileSize?: number;
  mimeType?: string | null;
  r2Key?: string | null;
};
type IncomingVariation = {
  id?: string;
  name?: string;
  slug?: string;
  price?: number | string;
  isActive?: boolean;
  images?: IncomingImage[];
  files?: IncomingFile[];
  attributeValues?: { attributeId: string; valueId: string }[];
};

// Drizzle insert types
type ProductImageInsert = typeof productImages.$inferInsert;
type FileInsert = typeof files.$inferInsert;
type VariationAttributeInsert = typeof variationAttributeValues.$inferInsert;
type ProductVariationInsert = typeof productVariations.$inferInsert;

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = (await params) as unknown as { id: string };

    // Get product
    const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Get related files
    const productFiles = await db.select().from(files).where(eq(files.productId, id));

    // Get product_attributes (list of attributes applied to this product)
    const prodAttrs = await db
      .select()
      .from(productAttributes)
      .where(eq(productAttributes.productId, id));

    // Get product images (product_images table)
    const images = await db.select().from(productImages).where(eq(productImages.productId, id));

    // Get variations and for each variation include files, images and attribute mappings
    const variationsRaw = await db
      .select()
      .from(productVariations)
      .where(eq(productVariations.productId, id));
    const variations = await Promise.all(
      variationsRaw.map(async v => {
        const variationFiles = await db.select().from(files).where(eq(files.variationId, v.id));
        const variationImages = await db
          .select()
          .from(productImages)
          .where(eq(productImages.variationId, v.id));
        const mappings = await db
          .select()
          .from(variationAttributeValues)
          .where(eq(variationAttributeValues.variationId, v.id));

        const attributeValues = mappings.map(m => ({
          attributeId: m.attributeId,
          valueId: m.valueId,
        }));

        return {
          ...v,
          files: variationFiles.map(f => ({
            filename: f.name,
            originalName: f.originalName,
            fileSize: f.size,
            mimeType: f.mimeType,
            r2Key: f.path,
          })),
          images: variationImages.map(img => ({
              id: img.id,
              name: img.name,
              data: (function () {
                const raw = img.data ?? ''
                const s = String(raw)
                if (!s) return ''
                if (s.startsWith('data:')) return s
                // If mimeType is image, build a data URI (we store images in DB)
                if (img.mimeType && img.mimeType.startsWith('image/')) return `data:${img.mimeType};base64,${s}`
                // Fallback: if it looks like base64, return data URI
                if (!s.includes(' ')) return `data:${img.mimeType || 'image/jpeg'};base64,${s}`
                // Otherwise assume it's an R2 path and convert to download URL
                return `/api/r2/download?r2Key=${encodeURIComponent(s)}`
              })(),
              mimeType: img.mimeType,
              alt: img.alt,
              isMain: img.isMain,
              order: img.sortOrder,
            })),
          attributeValues,
        };
      })
    );

    const completeProduct = {
      ...product,
      files: productFiles.map(f => ({
        filename: f.name,
        originalName: f.originalName,
        fileSize: f.size,
        mimeType: f.mimeType,
        r2Key: f.path,
      })),
      images: images.map(img => ({
        id: img.id,
        name: img.name,
        data: (function () {
          const raw = img.data ?? ''
          const s = String(raw)
          if (!s) return ''
          if (s.startsWith('data:')) return s
          if (img.mimeType && img.mimeType.startsWith('image/')) return `data:${img.mimeType};base64,${s}`
          if (!s.includes(' ')) return `data:${img.mimeType || 'image/jpeg'};base64,${s}`
          return `/api/r2/download?r2Key=${encodeURIComponent(s)}`
        })(),
        mimeType: img.mimeType,
        alt: img.alt,
        isMain: img.isMain,
        order: img.sortOrder,
      })),
      variations,
      attributes: prodAttrs.map(pa => ({ attributeId: pa.attributeId, valueIds: [] })),
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

    // If variations were provided in the body, sync/create/update variations, files, images and attribute values
    if (body.variations && Array.isArray(body.variations)) {
      for (const variation of body.variations as IncomingVariation[]) {
        if (variation.id) {
          // existing variation: update its fields
          await db
            .update(productVariations)
            .set({
              name: variation.name,
              slug: variation.slug || variation.name?.toLowerCase().replace(/\s+/g, '-'),
              price: String(variation.price),
              isActive: variation.isActive ?? true,
              updatedAt: new Date(),
            })
            .where(eq(productVariations.id, variation.id))
            .execute();

          // replace variation images if provided
          if (variation.images && Array.isArray(variation.images)) {
            await db
              .delete(productImages)
              .where(eq(productImages.variationId, variation.id))
              .execute();
            const imgsRaw: Array<ProductImageInsert | null> = (variation.images || []).map(
              (img: IncomingImage) => {
                const data = img.data ?? '';
                if (!data) return null;
                // Extrair mimeType do data URI se estiver presente
                let mimeType = 'image/jpeg';
                const dataStr = String(data);
                if (dataStr.startsWith('data:')) {
                  const match = dataStr.match(/^data:([^;]+);/);
                  if (match) mimeType = match[1];
                }
                return {
                  variationId: variation.id!,
                  name: `var-img-${Date.now()}.jpg`,
                  originalName: `var-img.jpg`,
                  mimeType: mimeType,
                  size: Math.round(String(data).length * 0.75),
                  data,
                  alt: img.alt ?? null,
                  sortOrder: img.order ?? 0,
                  isMain: img.isMain ?? false,
                  createdAt: new Date(),
                };
              }
            );
            const imgs = imgsRaw.filter((i): i is ProductImageInsert => i !== null);
            if (imgs.length > 0) await db.insert(productImages).values(imgs).execute();
          }

          // replace variation files if provided
          if (variation.files && Array.isArray(variation.files)) {
            await db.delete(files).where(eq(files.variationId, variation.id)).execute();
            const flsRaw: Array<FileInsert | null> = (variation.files || []).map(
              (f: IncomingFile) => {
                const path = f.r2Key ?? '';
                if (!path) return null;
                return {
                  variationId: variation.id!,
                  name: f.filename,
                  originalName: f.originalName ?? '',
                  mimeType: f.mimeType ?? '',
                  size: f.fileSize ?? 0,
                  path,
                  createdAt: new Date(),
                };
              }
            );
            const fls = flsRaw.filter((i): i is FileInsert => i !== null);
            if (fls.length > 0) await db.insert(files).values(fls).execute();
          }

          // sync attribute mappings
          await db
            .delete(variationAttributeValues)
            .where(eq(variationAttributeValues.variationId, variation.id))
            .execute();
          if (
            variation.attributeValues &&
            Array.isArray(variation.attributeValues) &&
            variation.attributeValues.length > 0
          ) {
            const vamp: VariationAttributeInsert[] = variation.attributeValues.map(
              (av: { attributeId: string; valueId: string }) =>
                ({
                  variationId: variation.id!,
                  attributeId: av.attributeId,
                  valueId: av.valueId,
                }) as VariationAttributeInsert
            );
            if (vamp.length > 0) await db.insert(variationAttributeValues).values(vamp).execute();
          }
        } else {
          // new variation: insert
          const newVarInsert: ProductVariationInsert = {
            productId: id,
            name: variation.name ?? '',
            slug: (variation.name || '').toLowerCase().replace(/\s+/g, '-'),
            price: String(variation.price || 0),
            isActive: variation.isActive ?? true,
            createdAt: new Date(),
            updatedAt: new Date(),
          } as ProductVariationInsert;
          const [newVar] = await db.insert(productVariations).values(newVarInsert).returning();
          if (variation.images && Array.isArray(variation.images)) {
            const imgsRawNew: Array<ProductImageInsert | null> = (variation.images || []).map(
              (img: IncomingImage) => {
                const data = img.data ?? '';
                if (!data) return null;
                // Extrair mimeType do data URI se estiver presente
                let mimeType = 'image/jpeg';
                const dataStr = String(data);
                if (dataStr.startsWith('data:')) {
                  const match = dataStr.match(/^data:([^;]+);/);
                  if (match) mimeType = match[1];
                }
                return {
                  variationId: newVar.id!,
                  name: `var-img-${Date.now()}.jpg`,
                  originalName: `var-img.jpg`,
                  mimeType: mimeType,
                  size: Math.round(String(data).length * 0.75),
                  data,
                  alt: img.alt ?? null,
                  sortOrder: img.order ?? 0,
                  isMain: img.isMain ?? false,
                  createdAt: new Date(),
                };
              }
            );
            const imgsNew = imgsRawNew.filter((i): i is ProductImageInsert => i !== null);
            if (imgsNew.length > 0) await db.insert(productImages).values(imgsNew).execute();
          }
          if (variation.files && Array.isArray(variation.files)) {
            const flsRawNew: Array<FileInsert | null> = (variation.files || []).map(
              (f: IncomingFile) => {
                const path = f.r2Key ?? '';
                if (!path) return null;
                return {
                  variationId: newVar.id!,
                  name: f.filename,
                  originalName: f.originalName ?? '',
                  mimeType: f.mimeType ?? '',
                  size: f.fileSize ?? 0,
                  path,
                  createdAt: new Date(),
                };
              }
            );
            const flsNew = flsRawNew.filter((i): i is FileInsert => i !== null);
            if (flsNew.length > 0) await db.insert(files).values(flsNew).execute();
          }
          if (
            variation.attributeValues &&
            Array.isArray(variation.attributeValues) &&
            variation.attributeValues.length > 0
          ) {
            const vampNew: VariationAttributeInsert[] = variation.attributeValues.map(
              (av: { attributeId: string; valueId: string }) =>
                ({
                  variationId: newVar.id!,
                  attributeId: av.attributeId,
                  valueId: av.valueId,
                }) as VariationAttributeInsert
            );
            if (vampNew.length > 0)
              await db.insert(variationAttributeValues).values(vampNew).execute();
          }
        }
      }
    }
    // Sync product images if provided
    if (body.images && Array.isArray(body.images)) {
      await db.delete(productImages).where(eq(productImages.productId, id)).execute();
      const imgsRaw2: Array<ProductImageInsert | null> = (body.images || []).map(
        (img: IncomingImage) => {
          const data = img.data ?? '';
          if (!data) return null;
          // Extrair mimeType do data URI se estiver presente
          let mimeType = 'image/jpeg';
          const dataStr = String(data);
          if (dataStr.startsWith('data:')) {
            const match = dataStr.match(/^data:([^;]+);/);
            if (match) mimeType = match[1];
          }
          return {
            productId: id,
            name: `image-${Date.now()}.jpg`,
            originalName: `product-image.jpg`,
            mimeType: mimeType,
            size: Math.round(String(data).length * 0.75),
            data,
            alt: img.alt ?? null,
            sortOrder: img.order ?? 0,
            isMain: img.isMain ?? false,
            createdAt: new Date(),
          };
        }
      );
      const imgs2 = imgsRaw2.filter((i): i is ProductImageInsert => i !== null);
      if (imgs2.length > 0) await db.insert(productImages).values(imgs2).execute();
    }

    // Get updated product with files/images/variations
    const productFiles = await db.select().from(files).where(eq(files.productId, id));
    const images = await db.select().from(productImages).where(eq(productImages.productId, id));
    const variationsRaw2 = await db
      .select()
      .from(productVariations)
      .where(eq(productVariations.productId, id));
    const variations2 = await Promise.all(
      variationsRaw2.map(async v => {
        const variationFiles = await db.select().from(files).where(eq(files.variationId, v.id));
        const variationImages = await db
          .select()
          .from(productImages)
          .where(eq(productImages.variationId, v.id));
        const mappings = await db
          .select()
          .from(variationAttributeValues)
          .where(eq(variationAttributeValues.variationId, v.id));
        const attributeValues = mappings.map(m => ({
          attributeId: m.attributeId,
          valueId: m.valueId,
        }));
        return {
          ...v,
          files: variationFiles.map(f => ({
            filename: f.name,
            originalName: f.originalName,
            fileSize: f.size,
            mimeType: f.mimeType,
            r2Key: f.path,
          })),
          images: variationImages.map(img => ({
            id: img.id,
            name: img.name,
            data: img.data,
            mimeType: img.mimeType,
            alt: img.alt,
            isMain: img.isMain,
            order: img.sortOrder,
          })),
          attributeValues,
        };
      })
    );

    const prodAttrs2 = await db
      .select()
      .from(productAttributes)
      .where(eq(productAttributes.productId, id));

    const completeProduct = {
      ...updatedProduct,
      files: productFiles.map(f => ({
        filename: f.name,
        originalName: f.originalName,
        fileSize: f.size,
        mimeType: f.mimeType,
        r2Key: f.path,
      })),
      images: images.map(img => ({
        id: img.id,
        name: img.name,
        data: img.data,
        mimeType: img.mimeType,
        alt: img.alt,
        isMain: img.isMain,
        order: img.sortOrder,
      })),
      variations: variations2,
      attributes: prodAttrs2.map(pa => ({ attributeId: pa.attributeId, valueIds: [] })),
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
