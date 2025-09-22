import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { products, files, productImages, productVariations } from '@/lib/db/schema';
import { eq, desc, like, or } from 'drizzle-orm';

const createProductSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  price: z.number().min(0.01),
  categoryId: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  images: z
    .array(
      z.object({
        data: z.string(), // Base64 data
        alt: z.string().optional(),
        isMain: z.boolean().default(false),
        order: z.number().default(0),
      })
    )
    .optional(),
  variations: z
    .array(
      z.object({
        name: z.string(),
        price: z.number(),
        isActive: z.boolean().default(true),
        images: z
          .array(
            z.object({
              data: z.string(), // Base64 data
              alt: z.string().optional(),
              isMain: z.boolean().default(false),
              order: z.number().default(0),
            })
          )
          .optional(),
        files: z
          .array(
            z.object({
              filename: z.string(),
              originalName: z.string(),
              fileSize: z.number(),
              mimeType: z.string(),
              r2Key: z.string(),
            })
          )
          .optional(),
      })
    )
    .optional(),
  files: z
    .array(
      z.object({
        filename: z.string(),
        originalName: z.string(),
        fileSize: z.number(),
        mimeType: z.string(),
        r2Key: z.string(),
      })
    )
    .optional(),
});

export async function GET(request: NextRequest) {
  try {
    // TODO: Add proper authentication
    // const session = await auth()
    // if (!session?.user || session.user.role !== 'admin') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const include = searchParams.get('include') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Query products
    let allProducts;

    if (search) {
      allProducts = await db
        .select()
        .from(products)
        .where(or(like(products.name, `%${search}%`), like(products.description, `%${search}%`)))
        .orderBy(desc(products.createdAt))
        .limit(limit)
        .offset(offset);
    } else {
      allProducts = await db
        .select()
        .from(products)
        .orderBy(desc(products.createdAt))
        .limit(limit)
        .offset(offset);
    }

    // Get related files and variations for each product
    const productsWithDetails = await Promise.all(
      allProducts.map(async product => {
        const productFiles = await db.select().from(files).where(eq(files.productId, product.id));
        
        let variations: object[] = [];
        if (include.includes('variations')) {
          const productVariationsList = await db
            .select()
            .from(productVariations)
            .where(eq(productVariations.productId, product.id));
          
          // Get files for each variation if requested
          if (include.includes('files')) {
            variations = await Promise.all(
              productVariationsList.map(async variation => {
                const variationFiles = await db
                  .select()
                  .from(files)
                  .where(eq(files.variationId, variation.id));
                return {
                  ...variation,
                  files: variationFiles
                };
              })
            );
          } else {
            variations = productVariationsList;
          }
        }

        return {
          ...product,
          files: productFiles,
          variations,
          // Mock additional fields for compatibility
          status: product.isActive ? 'active' : 'draft',
          digitalProduct: true,
          category: 'digital',
          images: [],
          tags: [],
        };
      })
    );

    return NextResponse.json({
      products: productsWithDetails,
      pagination: {
        page,
        limit,
        total: allProducts.length,
      },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // TODO: Add proper authentication
    // const session = await auth()
    // if (!session?.user || session.user.role !== 'admin') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const body = await request.json();

    console.log('=== RECEBIDO NA API ===');
    console.log('Product data:', {
      name: body.name,
      description: body.description,
      price: body.price,
      categoryId: body.categoryId,
      filesCount: body.files?.length || 0,
      imagesCount: body.images?.length || 0,
      variationsCount: body.variations?.length || 0,
    });
    console.log('Files:', body.files?.length || 0);
    console.log('Variations:', body.variations?.length || 0);
    if (body.variations) {
      body.variations.forEach(
        (v: { name: string; files?: { filename: string; r2Key: string }[] }, i: number) => {
          console.log(`Variation ${i} (${v.name}): ${v.files?.length || 0} files`);
          if (v.files) {
            v.files.forEach((f: { filename: string; r2Key: string }, fi: number) => {
              console.log(`  File ${fi}: ${f.filename} -> r2Key: ${f.r2Key}`);
            });
          }
        }
      );
    }

    let validatedData;
    try {
      validatedData = createProductSchema.parse(body);
    } catch (error) {
      console.error('Validation error:', error);
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: 'Dados inválidos',
            details: error.issues,
          },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: 'Erro de validação' }, { status: 400 });
    }

    // Generate base slug from name (ou usar o slug enviado se estiver editando)
    const baseSlug =
      validatedData.slug ||
      validatedData.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .trim();

    // Ensure unique slug by checking database and incrementing if needed
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existingProduct = await db
        .select()
        .from(products)
        .where(eq(products.slug, slug))
        .limit(1);

      if (existingProduct.length === 0) {
        break; // Slug is unique
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create product - using all schema fields
    const newProduct = {
      name: validatedData.name,
      slug,
      description: validatedData.description || null,
      shortDescription: validatedData.shortDescription || null,
      price: validatedData.price.toString(), // Convert to string for decimal field
      categoryId: validatedData.categoryId || null,
      isActive: validatedData.isActive,
      isFeatured: validatedData.isFeatured,
      seoTitle: validatedData.seoTitle || validatedData.name,
      seoDescription: validatedData.seoDescription || validatedData.description || null,
    };

    const [insertedProduct] = await db.insert(products).values(newProduct).returning();

    // Insert product images if provided
    if (validatedData.images && validatedData.images.length > 0) {
      const imageData = validatedData.images.map(image => ({
        productId: insertedProduct.id,
        name: `image-${Date.now()}.jpg`, // Nome temporário
        originalName: `product-image.jpg`, // Nome temporário
        mimeType: 'image/jpeg', // Tipo temporário - poderia ser extraído do base64
        size: Math.round(image.data.length * 0.75), // Estimativa do tamanho baseado no base64
        data: image.data,
        alt: image.alt || validatedData.name,
        isMain: image.isMain,
        sortOrder: image.order,
      }));

      await db.insert(productImages).values(imageData);
    }

    // Insert variations if provided
    if (validatedData.variations && validatedData.variations.length > 0) {
      for (const variation of validatedData.variations) {
        // Generate slug for variation
        const variationSlug = variation.name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim();

        const [insertedVariation] = await db
          .insert(productVariations)
          .values({
            productId: insertedProduct.id,
            name: variation.name,
            slug: variationSlug,
            price: variation.price.toString(),
            isActive: variation.isActive,
          })
          .returning();

        // Insert variation images if provided
        if (variation.images && variation.images.length > 0) {
          const variationImageData = variation.images.map(image => ({
            variationId: insertedVariation.id,
            name: `variation-image-${Date.now()}.jpg`,
            originalName: `variation-image.jpg`,
            mimeType: 'image/jpeg',
            size: Math.round(image.data.length * 0.75),
            data: image.data,
            alt: image.alt || variation.name,
            isMain: image.isMain,
            sortOrder: image.order,
          }));

          await db.insert(productImages).values(variationImageData);
        }

        // Insert variation files if provided
        if (variation.files && variation.files.length > 0) {
          const variationFileData = variation.files.map(file => ({
            variationId: insertedVariation.id,
            name: file.filename,
            originalName: file.originalName,
            mimeType: file.mimeType,
            size: file.fileSize,
            path: `products/${insertedProduct.id}/variations/${insertedVariation.id}/${file.filename}`,
            r2Key: file.r2Key,
          }));

          await db.insert(files).values(variationFileData);
        }
      }
    }

    // Insert files if provided (for the main product)
    if (validatedData.files && validatedData.files.length > 0) {
      const fileData = validatedData.files.map(file => ({
        productId: insertedProduct.id,
        name: file.filename,
        originalName: file.originalName,
        mimeType: file.mimeType,
        size: file.fileSize,
        path: `products/${insertedProduct.id}/${file.filename}`,
        r2Key: file.r2Key,
      }));

      await db.insert(files).values(fileData);
    }

    // Fetch the complete product with files
    const productFiles = await db
      .select()
      .from(files)
      .where(eq(files.productId, insertedProduct.id));

    const completeProduct = {
      ...insertedProduct,
      files: productFiles,
      status: insertedProduct.isActive ? 'active' : 'draft',
      digitalProduct: true,
      category: 'digital',
      images: [],
      tags: [],
    };

    return NextResponse.json(completeProduct, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
