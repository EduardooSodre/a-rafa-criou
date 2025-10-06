import { db } from '@/lib/db';
import { productImages, productVariations } from '@/lib/db/schema';
import { eq, and, isNull, inArray } from 'drizzle-orm';
import { deleteMultipleImagesFromCloudinary } from '@/lib/cloudinary';

/**
 * Limpa imagens antigas de um produto ao atualizar
 * Deleta imagens que não estão mais na lista de imagens do produto
 * @param productId - ID do produto
 * @param newCloudinaryIds - Array de cloudinaryIds que devem ser mantidos
 * @returns Número de imagens deletadas
 */
export async function cleanupProductImages(
  productId: string,
  newCloudinaryIds: string[]
): Promise<number> {
  try {
    // Buscar imagens atuais do produto no banco (apenas imagens diretas do produto, sem variação)
    const currentImages = await db
      .select()
      .from(productImages)
      .where(and(eq(productImages.productId, productId), isNull(productImages.variationId)));

    // Filtrar imagens que serão deletadas (não estão na nova lista)
    const imagesToDelete = currentImages.filter(
      img => !newCloudinaryIds.includes(img.cloudinaryId)
    );

    if (imagesToDelete.length === 0) return 0;

    // Deletar do Cloudinary
    const cloudinaryIds = imagesToDelete.map(img => img.cloudinaryId);
    const deletedCount = await deleteMultipleImagesFromCloudinary(cloudinaryIds);

    // Deletar do banco de dados
    for (const img of imagesToDelete) {
      await db.delete(productImages).where(eq(productImages.id, img.id));
    }

    return deletedCount;
  } catch (error) {
    console.error('Erro ao limpar imagens do produto:', error);
    return 0;
  }
}

/**
 * Limpa imagens antigas de uma variação ao atualizar
 * @param variationId - ID da variação
 * @param newCloudinaryIds - Array de cloudinaryIds que devem ser mantidos
 * @returns Número de imagens deletadas
 */
export async function cleanupVariationImages(
  variationId: string,
  newCloudinaryIds: string[]
): Promise<number> {
  try {
    // Buscar imagens atuais da variação no banco
    const currentImages = await db
      .select()
      .from(productImages)
      .where(eq(productImages.variationId, variationId));

    // Filtrar imagens que serão deletadas
    const imagesToDelete = currentImages.filter(
      img => !newCloudinaryIds.includes(img.cloudinaryId)
    );

    if (imagesToDelete.length === 0) return 0;

    // Deletar do Cloudinary
    const cloudinaryIds = imagesToDelete.map(img => img.cloudinaryId);
    const deletedCount = await deleteMultipleImagesFromCloudinary(cloudinaryIds);

    // Deletar do banco de dados
    for (const img of imagesToDelete) {
      await db.delete(productImages).where(eq(productImages.id, img.id));
    }

    return deletedCount;
  } catch (error) {
    console.error('Erro ao limpar imagens da variação:', error);
    return 0;
  }
}

/**
 * Deleta TODAS as imagens de um produto (usado ao deletar o produto)
 * Inclui imagens diretas do produto E imagens de todas as variações
 * @param productId - ID do produto
 * @returns Número de imagens deletadas
 */
export async function deleteAllProductImages(productId: string): Promise<number> {
  try {
    // 1. Buscar todas as variações do produto
    const variations = await db
      .select()
      .from(productVariations)
      .where(eq(productVariations.productId, productId));

    const variationIds = variations.map(v => v.id);

    // 2. Buscar TODAS as imagens (produto direto + todas variações)
    const allImages = [];

    // Imagens diretas do produto (productId preenchido, variationId NULL)
    const productDirectImages = await db
      .select()
      .from(productImages)
      .where(and(eq(productImages.productId, productId), isNull(productImages.variationId)));

    allImages.push(...productDirectImages);

    // Imagens das variações (variationId preenchido)
    if (variationIds.length > 0) {
      const variationImages = await db
        .select()
        .from(productImages)
        .where(inArray(productImages.variationId, variationIds));

      allImages.push(...variationImages);
    }

    if (allImages.length === 0) {
      console.log(`Nenhuma imagem encontrada para o produto ${productId}`);
      return 0;
    }

    console.log(
      `Deletando ${allImages.length} imagens do produto ${productId} (${productDirectImages.length} diretas + ${allImages.length - productDirectImages.length} de variações)`
    );

    // 3. Deletar do Cloudinary
    const cloudinaryIds = allImages.map(img => img.cloudinaryId);
    const deletedCount = await deleteMultipleImagesFromCloudinary(cloudinaryIds);

    // 4. Deletar do banco de dados
    // Deletar imagens diretas do produto
    await db
      .delete(productImages)
      .where(and(eq(productImages.productId, productId), isNull(productImages.variationId)));

    // Deletar imagens das variações (o cascade do schema já fará isso, mas por garantia)
    if (variationIds.length > 0) {
      await db.delete(productImages).where(inArray(productImages.variationId, variationIds));
    }

    console.log(`${deletedCount} imagens deletadas do Cloudinary com sucesso`);
    return deletedCount;
  } catch (error) {
    console.error('Erro ao deletar todas as imagens do produto:', error);
    return 0;
  }
}

/**
 * Deleta TODAS as imagens de uma variação (usado ao deletar a variação)
 * @param variationId - ID da variação
 * @returns Número de imagens deletadas
 */
export async function deleteAllVariationImages(variationId: string): Promise<number> {
  try {
    // Buscar todas as imagens da variação
    const images = await db
      .select()
      .from(productImages)
      .where(eq(productImages.variationId, variationId));

    if (images.length === 0) return 0;

    // Deletar do Cloudinary
    const cloudinaryIds = images.map(img => img.cloudinaryId);
    const deletedCount = await deleteMultipleImagesFromCloudinary(cloudinaryIds);

    // Deletar do banco de dados
    await db.delete(productImages).where(eq(productImages.variationId, variationId));

    return deletedCount;
  } catch (error) {
    console.error('Erro ao deletar todas as imagens da variação:', error);
    return 0;
  }
}
