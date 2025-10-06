import { db } from '@/lib/db';
import { productImages } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
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
    // Buscar imagens atuais do produto no banco
    const currentImages = await db
      .select()
      .from(productImages)
      .where(and(eq(productImages.productId, productId), eq(productImages.variationId, '')));

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
 * @param productId - ID do produto
 * @returns Número de imagens deletadas
 */
export async function deleteAllProductImages(productId: string): Promise<number> {
  try {
    // Buscar todas as imagens do produto
    const images = await db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, productId));

    if (images.length === 0) return 0;

    // Deletar do Cloudinary
    const cloudinaryIds = images.map(img => img.cloudinaryId);
    const deletedCount = await deleteMultipleImagesFromCloudinary(cloudinaryIds);

    // Deletar do banco de dados
    await db.delete(productImages).where(eq(productImages.productId, productId));

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
