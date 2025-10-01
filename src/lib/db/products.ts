import { db } from './index';
import { eq } from 'drizzle-orm';
import {
  products,
  productVariations,
  productImages,
  categories,
  attributes,
  attributeValues,
  variationAttributeValues,
  files,
} from './schema';

export async function getProductBySlug(slug: string) {
  // Busca produto principal
  const productResult = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
  const product = productResult[0];
  if (!product) return null;

  // Busca categoria
  let category = null;
  if (product.categoryId) {
    const catResult = await db
      .select()
      .from(categories)
      .where(eq(categories.id, product.categoryId))
      .limit(1);
    category = catResult[0]?.name || null;
  }

  // Busca variações
  const variations = await db
    .select()
    .from(productVariations)
    .where(eq(productVariations.productId, product.id));

  // Para cada variação, buscar os valores de atributo associados E as imagens
  const variationsWithAttributes = await Promise.all(
    variations.map(async v => {
      const mappings = await db
        .select()
        .from(variationAttributeValues)
        .where(eq(variationAttributeValues.variationId, v.id));
      // Buscar os value records
      const valueDetails = await Promise.all(
        mappings.map(async m => {
          const [val] = await db
            .select()
            .from(attributeValues)
            .where(eq(attributeValues.id, m.valueId))
            .limit(1);
          const [attr] = await db
            .select()
            .from(attributes)
            .where(eq(attributes.id, m.attributeId))
            .limit(1);
          return {
            attributeId: m.attributeId,
            attributeName: attr?.name || null,
            valueId: m.valueId,
            value: val?.value || null,
          };
        })
      );

      // Buscar arquivos da variação (r2Key)
      const variationFiles = await db.select().from(files).where(eq(files.variationId, v.id));

      // Buscar imagens da variação
      const variationImagesResult = await db
        .select()
        .from(productImages)
        .where(eq(productImages.variationId, v.id));
      
      const variationImages = variationImagesResult.map(img => {
        const raw = img.data || '';
        if (!raw) return '/file.svg';
        if (String(raw).startsWith('data:')) return String(raw);
        return `data:${img.mimeType || 'image/jpeg'};base64,${raw}`;
      });

      return {
        id: v.id,
        name: v.name,
        price: Number(v.price),
        description: v.slug,
        downloadLimit: 10,
        fileSize: '-',
        attributeValues: valueDetails,
        files: variationFiles.map(f => ({ id: f.id, path: f.path, name: f.name })),
        images: variationImages.length > 0 ? variationImages : undefined,
      };
    })
  );

  // Busca imagens
  const imagesResult = await db
    .select()
    .from(productImages)
    .where(eq(productImages.productId, product.id));
  // Converte base64 do banco para data URI
  const images =
    imagesResult.length > 0
      ? imagesResult.map(img => {
          const raw = img.data || '';
          if (!raw) return '/file.svg';
          // Se já é data URI, retorna direto
          if (String(raw).startsWith('data:')) return String(raw);
          // Caso contrário, assume que é base64 e monta o data URI
          return `data:${img.mimeType || 'image/jpeg'};base64,${raw}`;
        })
      : ['/file.svg'];

  // Monta objeto final para o ProductDetailClient
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.shortDescription || product.description || '',
    longDescription: product.description || '',
    basePrice: Number(product.price),
    category: category || '',
    tags: [], // Adapte se houver tags
    images,
    variations: variationsWithAttributes,
  };
}
