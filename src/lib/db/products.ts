import { db } from './index';
import { eq } from 'drizzle-orm';
import { products, productVariations, productImages, categories } from './schema';

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

  // Busca imagens
  const imagesResult = await db
    .select()
    .from(productImages)
    .where(eq(productImages.productId, product.id));
  // Pega só o campo data (base64) ou path, ou monta url se necessário
  const images =
    imagesResult.length > 0 ? imagesResult.map(img => img.data || '/file.svg') : ['/file.svg'];

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
    variations: variations.map(v => ({
      id: v.id,
      name: v.name,
      price: Number(v.price),
      description: v.slug,
      downloadLimit: 10, // Adapte se houver campo
      fileSize: '-', // Adapte se houver campo
    })),
  };
}
