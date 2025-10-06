import { v2 as cloudinary } from 'cloudinary';

// Configuração do Cloudinary (server-side only)
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const FOLDER = process.env.CLOUDINARY_FOLDER || 'a-rafa-criou';

interface UploadOptions {
  folder?: 'products' | 'variations';
  filename?: string;
}

interface UploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

/**
 * Upload de imagem para o Cloudinary
 * @param base64Data - String base64 da imagem (com ou sem data URI prefix)
 * @param options - Opções de upload (pasta, nome do arquivo)
 * @returns Informações da imagem no Cloudinary
 */
export async function uploadImageToCloudinary(
  base64Data: string,
  options: UploadOptions = {}
): Promise<UploadResult> {
  try {
    console.log('uploadImageToCloudinary - Iniciando...', {
      dataLength: base64Data?.length || 0,
      startsWithData: base64Data?.startsWith('data:'),
      folder: options.folder,
    });

    // Garantir que o base64 tem o prefixo data URI
    let dataUri = base64Data;
    if (!base64Data.startsWith('data:')) {
      // Detectar mime type da imagem
      const mimeType = detectMimeType(base64Data);
      dataUri = `data:${mimeType};base64,${base64Data}`;
      console.log('Data URI construído com mime type:', mimeType);
    }

    // Construir caminho da pasta no Cloudinary
    const subfolder = options.folder || 'products';
    const folderPath = `${FOLDER}/images/${subfolder}`;

    console.log('Fazendo upload para:', folderPath);

    // Upload para Cloudinary
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: folderPath,
      resource_type: 'image',
      transformation: [
        {
          width: 1200,
          height: 1200,
          crop: 'limit', // Não corta, apenas limita o tamanho máximo
          quality: 'auto:good', // Qualidade automática otimizada
          fetch_format: 'auto', // Formato automático (WebP quando suportado)
        },
      ],
      // public_id customizado (opcional)
      ...(options.filename && { public_id: options.filename }),
    });

    console.log('Upload bem-sucedido:', {
      publicId: result.public_id,
      format: result.format,
      size: result.bytes,
    });

    return {
      publicId: result.public_id,
      url: result.url,
      secureUrl: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    };
  } catch (error) {
    console.error('Erro detalhado no upload para Cloudinary:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      config: {
        cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
        hasApiKey: !!process.env.CLOUDINARY_API_KEY,
        hasApiSecret: !!process.env.CLOUDINARY_API_SECRET,
      },
    });
    throw new Error(
      'Falha no upload da imagem para Cloudinary: ' +
        (error instanceof Error ? error.message : 'Unknown error')
    );
  }
}

/**
 * Deleta uma imagem do Cloudinary
 * @param publicId - Public ID da imagem no Cloudinary (ex: "a-rafa-criou/images/products/abc123")
 * @returns true se deletado com sucesso
 */
export async function deleteImageFromCloudinary(publicId: string): Promise<boolean> {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'image',
    });

    // result.result pode ser "ok" (deletado) ou "not found" (já não existe)
    return result.result === 'ok' || result.result === 'not found';
  } catch (error) {
    console.error('Erro ao deletar imagem do Cloudinary:', error);
    // Não lançar erro para não bloquear outras operações
    return false;
  }
}

/**
 * Deleta múltiplas imagens do Cloudinary
 * @param publicIds - Array de Public IDs
 * @returns Número de imagens deletadas com sucesso
 */
export async function deleteMultipleImagesFromCloudinary(publicIds: string[]): Promise<number> {
  if (!publicIds || publicIds.length === 0) return 0;

  try {
    const result = await cloudinary.api.delete_resources(publicIds, {
      resource_type: 'image',
    });

    // Contar quantas foram deletadas com sucesso
    const deleted = Object.values(result.deleted || {}).filter(
      status => status === 'deleted'
    ).length;

    return deleted;
  } catch (error) {
    console.error('Erro ao deletar múltiplas imagens do Cloudinary:', error);
    // Fallback: tentar deletar uma por uma
    let count = 0;
    for (const publicId of publicIds) {
      const success = await deleteImageFromCloudinary(publicId);
      if (success) count++;
    }
    return count;
  }
}

/**
 * Detecta o MIME type de uma string base64
 * @param base64String - String base64 (sem prefixo data URI)
 * @returns MIME type detectado
 */
function detectMimeType(base64String: string): string {
  // Detecta pelo magic number (primeiros bytes)
  const signatures: Record<string, string> = {
    '/9j/': 'image/jpeg',
    iVBORw0KGgo: 'image/png',
    R0lGODlh: 'image/gif',
    UklGR: 'image/webp',
  };

  for (const [signature, mimeType] of Object.entries(signatures)) {
    if (base64String.startsWith(signature)) {
      return mimeType;
    }
  }

  // Fallback para JPEG (formato mais comum)
  return 'image/jpeg';
}

/**
 * Valida se as credenciais do Cloudinary estão configuradas
 * @returns true se todas as credenciais estão presentes
 */
export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

export { cloudinary };
