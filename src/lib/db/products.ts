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

  // Busca variações do produto
  const variations = await db
    .select()
    .from(productVariations)
    .where(eq(productVariations.productId, product.id));

  const variationIds = variations.map(v => v.id);

  // Busca TODOS os dados de uma vez (otimização N+1 → 4 queries fixas)
  const [allMappings, allValues, allAttrs, allFiles, allVariationImages] = await Promise.all([
    // 1. Todos os mappings de atributos para estas variações
    variationIds.length > 0
      ? Promise.all(variationIds.map(vId =>
          db.select().from(variationAttributeValues).where(eq(variationAttributeValues.variationId, vId))
        )).then(results => results.flat())
      : Promise.resolve([]),

    // 2. Todos os valores de atributos
    db.select().from(attributeValues),

    // 3. Todos os atributos
    db.select().from(attributes),

    // 4. Todos os arquivos destas variações
    variationIds.length > 0
      ? Promise.all(variationIds.map(vId => db.select().from(files).where(eq(files.variationId, vId)))).then(r =>
          r.flat()
        )
      : Promise.resolve([]),

    // 5. Todas as imagens das variações
    variationIds.length > 0
      ? Promise.all(
          variationIds.map(vId => db.select().from(productImages).where(eq(productImages.variationId, vId)))
        ).then(r => r.flat())
      : Promise.resolve([]),
  ]);

  // Mapeia em objetos para acesso rápido O(1)
  const valuesMap = new Map(allValues.map(v => [v.id, v]));
  const attrsMap = new Map(allAttrs.map(a => [a.id, a]));
  const filesMap = new Map<string, typeof allFiles>();
  const imagesMap = new Map<string, typeof allVariationImages>();

  allFiles.forEach(f => {
    if (!f.variationId) return;
    if (!filesMap.has(f.variationId)) filesMap.set(f.variationId, []);
    filesMap.get(f.variationId)!.push(f);
  });

  allVariationImages.forEach(img => {
    if (!img.variationId) return;
    if (!imagesMap.has(img.variationId)) imagesMap.set(img.variationId, []);
    imagesMap.get(img.variationId)!.push(img);
  });

  // Monta variações com seus atributos (agora tudo em memória, sem queries extras)
  const variationsWithAttributes = variations.map(v => {
    const mappings = allMappings.filter(m => m.variationId === v.id);
    const valueDetails = mappings.map(m => {
      const val = valuesMap.get(m.valueId);
      const attr = attrsMap.get(m.attributeId);
      return {
        attributeId: m.attributeId,
        attributeName: attr?.name || null,
        valueId: m.valueId,
        value: val?.value || null,
      };
    });

    const variationFiles = filesMap.get(v.id) || [];
    const variationImagesResult = imagesMap.get(v.id) || [];

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
  });

  // Busca imagens principais do produto (1 query)
  const imagesResult = await db.select().from(productImages).where(eq(productImages.productId, product.id));
  
  const images =
    imagesResult.length > 0
      ? imagesResult.map(img => {
          const raw = img.data || '';
          if (!raw) return '/file.svg';
          if (String(raw).startsWith('data:')) return String(raw);
          return `data:${img.mimeType || 'image/jpeg'};base64,${raw}`;
        })
      : ['/file.svg'];

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.shortDescription || product.description || '',
    longDescription: product.description || '',
    basePrice: Number(product.price),
    category: category || '',
    tags: [],
    images,
    variations: variationsWithAttributes,
  };
}
