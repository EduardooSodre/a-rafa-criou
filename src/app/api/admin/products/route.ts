import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { products, files, productImages, productVariations, categories } from '@/lib/db/schema';
import {
  productAttributes,
  variationAttributeValues,
  attributes,
  attributeValues,
} from '@/lib/db/schema';
import { eq, desc, or, and, ilike, isNull } from 'drizzle-orm';

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
        attributeValues: z
          .array(
            z.object({
              attributeId: z.string(),
              valueId: z.string(),
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

// Schema for attribute definitions (client-created local attributes)
const attributeDefSchema = z.object({
  id: z.string(), // local id from frontend (ex: local-...)
  name: z.string(),
  values: z.array(z.object({ id: z.string(), value: z.string() })),
});

// Extend createProductSchema with optional attributeDefinitions
const createProductSchemaWithDefs = createProductSchema.extend({
  attributeDefinitions: z.array(attributeDefSchema).optional(),
  attributes: z
    .array(z.object({ attributeId: z.string(), valueIds: z.array(z.string()) }))
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
    const category = searchParams.get('category') || '';
    const include = searchParams.get('include') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [];

    // Case-insensitive search
    if (search) {
      conditions.push(
        or(
          ilike(products.name, `%${search}%`),
          ilike(products.description, `%${search}%`),
          ilike(products.slug, `%${search}%`)
        )
      );
    }

    // Category filter - check both slug and categoryId
    if (category) {
      if (category === 'sem-categoria' || category === 'uncategorized') {
        // Show products without category
        conditions.push(isNull(products.categoryId));
      } else {
        // First, try to find category by slug
        const categoryRecord = await db
          .select()
          .from(categories)
          .where(eq(categories.slug, category))
          .limit(1);

        if (categoryRecord.length > 0) {
          conditions.push(eq(products.categoryId, categoryRecord[0].id));
        } else {
          // If no category found by slug, try as categoryId
          conditions.push(eq(products.categoryId, category));
        }
      }
    }

    // Query products with conditions
    let allProducts;

    if (conditions.length > 0) {
      allProducts = await db
        .select()
        .from(products)
        .where(and(...conditions))
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
                  files: variationFiles,
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
      // validate with extended schema to accept attributeDefinitions
      validatedData = createProductSchemaWithDefs.parse(body as unknown);
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

    // Narrow validated data to the extended schema type
    const validated = validatedData as z.infer<typeof createProductSchemaWithDefs>;

    // Wrap DB operations in a transaction to ensure atomicity
    const result = await db.transaction(async tx => {
      const [insertedProduct] = await tx.insert(products).values(newProduct).returning();

      // If client provided attributeDefinitions (local-created attributes), create them first and build maps
      const localAttrDefs = validated.attributeDefinitions || [];
      const localAttrIdToReal: Record<string, string> = {};
      const localValIdToReal: Record<string, string> = {};

      if (Array.isArray(localAttrDefs) && localAttrDefs.length > 0) {
        for (const def of localAttrDefs) {
          const attrSlug = def.name.toLowerCase().replace(/\s+/g, '-');

          // Verificar se o atributo já existe
          const existingAttr = await tx
            .select()
            .from(attributes)
            .where(eq(attributes.slug, attrSlug))
            .limit(1);

          let attributeId: string;

          if (existingAttr.length > 0) {
            // Reutilizar atributo existente
            attributeId = existingAttr[0].id;
          } else {
            // Criar novo atributo
            const [createdAttr] = await tx
              .insert(attributes)
              .values({
                name: def.name,
                slug: attrSlug,
                createdAt: new Date(),
                updatedAt: new Date(),
              })
              .returning();
            attributeId = createdAttr.id;
          }

          localAttrIdToReal[def.id] = attributeId;

          // Processar valores do atributo
          if (Array.isArray(def.values)) {
            for (const val of def.values) {
              const valSlug = val.value.toLowerCase().replace(/\s+/g, '-');

              // Verificar se o valor já existe para este atributo
              const existingVal = await tx
                .select()
                .from(attributeValues)
                .where(
                  and(
                    eq(attributeValues.attributeId, attributeId),
                    eq(attributeValues.slug, valSlug)
                  )
                )
                .limit(1);

              let valueId: string;

              if (existingVal.length > 0) {
                // Reutilizar valor existente
                valueId = existingVal[0].id;
              } else {
                // Criar novo valor
                const [createdVal] = await tx
                  .insert(attributeValues)
                  .values({
                    attributeId: attributeId,
                    value: val.value,
                    slug: valSlug,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  })
                  .returning();
                valueId = createdVal.id;
              }

              localValIdToReal[val.id] = valueId;
            }
          }
        }
      }

      // Insert product images if provided
      if (validated.images && validated.images.length > 0) {
        const imageData = validated.images.map(image => {
          // Extrair mimeType e base64 puro do data URI
          let mimeType = 'image/jpeg';
          let base64Data = image.data;
          const dataStr = String(image.data);

          if (dataStr.startsWith('data:')) {
            const match = dataStr.match(/^data:([^;]+);base64,(.+)$/);
            if (match) {
              mimeType = match[1];
              base64Data = match[2]; // Apenas o base64, sem o prefixo
            }
          }

          return {
            productId: insertedProduct.id,
            name: `image-${Date.now()}.jpg`,
            originalName: `product-image.jpg`,
            mimeType: mimeType,
            size: Math.round(base64Data.length * 0.75),
            data: base64Data, // Salva apenas o base64 puro
            alt: image.alt || validated.name,
            isMain: image.isMain,
            sortOrder: image.order,
          };
        });

        await tx.insert(productImages).values(imageData);
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

          const [insertedVariation] = await tx
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
            const variationImageData = variation.images.map(image => {
              // Extrair mimeType e base64 puro do data URI
              let mimeType = 'image/jpeg';
              let base64Data = image.data;
              const dataStr = String(image.data);

              if (dataStr.startsWith('data:')) {
                const match = dataStr.match(/^data:([^;]+);base64,(.+)$/);
                if (match) {
                  mimeType = match[1];
                  base64Data = match[2]; // Apenas o base64, sem o prefixo
                }
              }

              return {
                variationId: insertedVariation.id,
                name: `variation-image-${Date.now()}.jpg`,
                originalName: `variation-image.jpg`,
                mimeType: mimeType,
                size: Math.round(base64Data.length * 0.75),
                data: base64Data, // Salva apenas o base64 puro
                alt: image.alt || variation.name,
                isMain: image.isMain,
                sortOrder: image.order,
              };
            });

            await tx.insert(productImages).values(variationImageData);
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

            await tx.insert(files).values(variationFileData);
          }

          // Persist variation attribute values mapping if provided
          if (
            variation.attributeValues &&
            Array.isArray(variation.attributeValues) &&
            variation.attributeValues.length > 0
          ) {
            const vamp = variation.attributeValues.map(
              (av: { attributeId: string; valueId: string }) => {
                let attrId = av.attributeId;
                let valId = av.valueId;
                if (attrId && attrId.startsWith('local-') && localAttrIdToReal[attrId])
                  attrId = localAttrIdToReal[attrId];
                if (valId && valId.startsWith('local-') && localValIdToReal[valId])
                  valId = localValIdToReal[valId];
                return {
                  variationId: insertedVariation.id,
                  attributeId: attrId,
                  valueId: valId,
                };
              }
            );
            if (vamp.length > 0) {
              await tx.insert(variationAttributeValues).values(vamp).execute();
            }
          }
        }
      }

      // Insert files if provided (for the main product)
      if (validated.files && validated.files.length > 0) {
        const fileData = validated.files.map(file => ({
          productId: insertedProduct.id,
          name: file.filename,
          originalName: file.originalName,
          mimeType: file.mimeType,
          size: file.fileSize,
          path: `products/${insertedProduct.id}/${file.filename}`,
          r2Key: file.r2Key,
        }));

        await tx.insert(files).values(fileData);
      }

      // Persist product_attributes if provided
      const attrsPayload = (
        validated as unknown as { attributes?: { attributeId: string; valueIds: string[] }[] }
      ).attributes;
      if (attrsPayload && Array.isArray(attrsPayload)) {
        const toInsert = attrsPayload.map(a => ({
          productId: insertedProduct.id,
          attributeId:
            a.attributeId && a.attributeId.startsWith('local-')
              ? localAttrIdToReal[a.attributeId] || a.attributeId
              : a.attributeId,
        }));
        if (toInsert.length > 0) {
          await tx.insert(productAttributes).values(toInsert).execute();
        }
      }

      // Fetch the complete product with files
      const productFiles = await tx
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

      return completeProduct;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    // Log with stack if available to aid debugging
    console.error(
      'Error creating product:',
      error instanceof Error ? error.message : String(error)
    );
    if (error instanceof Error && (error as Error).stack) console.error((error as Error).stack);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    // In development it's useful to return a short error message to the client for debugging.
    // Keep the response generic in production.
    const errMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Internal server error', details: errMsg }, { status: 500 });
  }
}
