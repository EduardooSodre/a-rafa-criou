import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2, R2_BUCKET } from "./r2";

/**
 * Faz upload de um arquivo para o Cloudflare R2
 * @param key - Caminho/nome do arquivo no bucket (ex: "pdfs/produto-123.pdf")
 * @param body - Buffer ou stream do arquivo
 * @param contentType - Tipo MIME do arquivo (ex: "application/pdf")
 * @returns Promise<void>
 */
export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array | string,
  contentType?: string
): Promise<void> {
  try {
    await r2.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: body,
        ContentType: contentType,
        ACL: "private", // Sempre privado para segurança
      })
    );
    console.log(`✅ Upload successful: ${key}`);
  } catch (error) {
    console.error(`❌ Upload failed for ${key}:`, error);
    throw error;
  }
}

/**
 * Gera uma URL assinada temporária para download seguro
 * @param key - Caminho do arquivo no bucket
 * @param expiresInSeconds - Tempo de expiração em segundos (padrão: 1 hora)
 * @returns Promise<string> - URL assinada
 */
export async function getR2SignedUrl(
  key: string,
  expiresInSeconds: number = 3600 // 1 hora por padrão
): Promise<string> {
  try {
    const url = await getSignedUrl(
      r2,
      new GetObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
      }),
      { expiresIn: expiresInSeconds }
    );
    
    console.log(`✅ Signed URL generated for: ${key} (expires in ${expiresInSeconds}s)`);
    return url;
  } catch (error) {
    console.error(`❌ Failed to generate signed URL for ${key}:`, error);
    throw error;
  }
}

/**
 * Remove um arquivo do Cloudflare R2
 * @param key - Caminho do arquivo no bucket
 * @returns Promise<void>
 */
export async function deleteFromR2(key: string): Promise<void> {
  try {
    await r2.send(
      new DeleteObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
      })
    );
    console.log(`✅ Delete successful: ${key}`);
  } catch (error) {
    console.error(`❌ Delete failed for ${key}:`, error);
    throw error;
  }
}

/**
 * Gera uma chave única para armazenar o arquivo
 * @param originalName - Nome original do arquivo
 * @param productId - ID do produto (opcional)
 * @returns string - Chave única para o arquivo
 */
export function generateFileKey(originalName: string, productId?: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const randomId = Math.random().toString(36).substring(2, 8);
  const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, "_");
  
  if (productId) {
    return `pdfs/produto-${productId}/${timestamp}-${randomId}-${sanitizedName}`;
  }
  
  return `pdfs/${timestamp}-${randomId}-${sanitizedName}`;
}

/**
 * Valida se o arquivo é um PDF
 * @param file - Arquivo a ser validado
 * @returns boolean
 */
export function isValidPDF(file: File): boolean {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

/**
 * Converte File para Buffer (para uso no servidor)
 * @param file - Arquivo File
 * @returns Promise<Buffer>
 */
export async function fileToBuffer(file: File): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
}