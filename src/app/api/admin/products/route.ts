import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { products, files } from '@/lib/db/schema';
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
  files: z
    .array(
      z.object({
        filename: z.string(),
        originalName: z.string(),
        fileSize: z.number(),
        mimeType: z.string(),
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

    // Get related files for each product
    const productsWithFiles = await Promise.all(
      allProducts.map(async product => {
        const productFiles = await db.select().from(files).where(eq(files.productId, product.id));

        return {
          ...product,
          files: productFiles,
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
      products: productsWithFiles,
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
    const validatedData = createProductSchema.parse(body);

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

    // Insert files if provided
    if (validatedData.files && validatedData.files.length > 0) {
      const fileData = validatedData.files.map(file => ({
        productId: insertedProduct.id,
        name: file.filename,
        originalName: file.originalName,
        mimeType: file.mimeType,
        size: file.fileSize,
        path: `products/${insertedProduct.id}/${file.filename}`,
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
