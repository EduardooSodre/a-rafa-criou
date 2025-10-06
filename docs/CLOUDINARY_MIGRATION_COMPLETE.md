# 🎨 Migração para Cloudinary - Implementação Completa

## ✅ O que já foi feito

### 1. **Infraestrutura Cloudinary**

- ✅ Instalado pacote `cloudinary`
- ✅ Criado `src/lib/cloudinary.ts` com funções:
  - `uploadImageToCloudinary()` - Upload com otimização automática (max 1200x1200, quality auto, WebP)
  - `deleteImageFromCloudinary()` - Delete de imagem única
  - `deleteMultipleImagesFromCloudinary()` - Delete em lote
  - `isCloudinaryConfigured()` - Validação de configuração

### 2. **API Routes**

- ✅ `/api/cloudinary/upload` (POST) - Upload de imagens com autenticação admin
- ✅ `/api/cloudinary/delete` (DELETE) - Remoção de imagens com validação de segurança

### 3. **Schema do Banco**

- ✅ Atualizado `product_images` table:
  - ❌ Removido: `data` (base64), `name`, `original_name`, `mime_type`
  - ✅ Adicionado: `cloudinary_id`, `url`, `width`, `height`, `format`
  - ✅ Mantido: `size` (agora opcional)
- ✅ Migração aplicada (drizzle-kit push)

### 4. **Utilities**

- ✅ `src/lib/utils/image-cleanup-cloudinary.ts`:
  - `cleanupProductImages()` - Limpa imagens antigas ao atualizar produto
  - `cleanupVariationImages()` - Limpa imagens antigas ao atualizar variação
  - `deleteAllProductImages()` - Deleta todas as imagens ao deletar produto
  - `deleteAllVariationImages()` - Deleta todas as imagens ao deletar variação

### 5. **Frontend (ProductForm)**

- ✅ Atualizado para fazer upload para Cloudinary via `/api/cloudinary/upload`
- ✅ Removido todo código de conversão base64
- ✅ Suporte para imagens existentes (cloudinaryId + url)
- ✅ Upload automático de:
  - Imagens de produtos → pasta `a-rafa-criou/images/products`
  - Imagens de variações → pasta `a-rafa-criou/images/variations`

### 6. **APIs Públicas**

- ✅ `/api/products` (GET) - Retorna `img.url` do Cloudinary
- ✅ `src/lib/db/products.ts` (`getProductBySlug`) - Retorna `img.url` do Cloudinary

---

## ⚠️ O que FALTA fazer (IMPORTANTE!)

### 🔴 **CRÍTICO: Atualizar API de Admin**

Você precisa atualizar manualmente:

#### 1. **src/app/api/admin/products/route.ts** (POST e PUT)

**Localizar a validação Zod (linha ~24):**

```typescript
// ANTES (base64):
images: z
  .array(
    z.object({
      data: z.string(),  // ❌ Remover
      alt: z.string().optional(),
      isMain: z.boolean().optional(),
      order: z.number().optional(),
    })
  )
  .optional(),
```

**Substituir por (Cloudinary):**

```typescript
// DEPOIS (Cloudinary):
images: z
  .array(
    z.object({
      cloudinaryId: z.string(),  // ✅ Public ID no Cloudinary
      url: z.string(),           // ✅ URL segura da imagem
      width: z.number().optional(),
      height: z.number().optional(),
      format: z.string().optional(),
      size: z.number().optional(),
      alt: z.string().optional(),
      isMain: z.boolean().optional(),
      order: z.number().optional(),
    })
  )
  .optional(),
```

**Localizar a inserção de imagens (linha ~404):**

```typescript
// ANTES (base64):
const imageData = validated.images.map(image => {
  return {
    productId: newProduct.id,
    name: image.alt || 'product-image',
    originalName: image.alt || 'product-image',
    mimeType: 'image/jpeg',
    size: 0,
    data: image.data, // ❌ Base64
    alt: image.alt,
    isMain: image.isMain ?? false,
    sortOrder: image.order ?? 0,
  };
});
```

**Substituir por (Cloudinary):**

```typescript
// DEPOIS (Cloudinary):
const imageData = validated.images.map(image => {
  return {
    productId: newProduct.id,
    cloudinaryId: image.cloudinaryId, // ✅ Public ID
    url: image.url, // ✅ URL
    width: image.width,
    height: image.height,
    format: image.format,
    size: image.size,
    alt: image.alt,
    isMain: image.isMain ?? false,
    sortOrder: image.order ?? 0,
  };
});
```

**Fazer o mesmo para variações (linha ~460):**

```typescript
// Procure por variationImageData e aplique a mesma lógica
```

#### 2. **src/app/api/admin/products/[id]/route.ts** (PUT e DELETE)

**No método PUT - adicionar cleanup antes de atualizar:**

```typescript
import { cleanupProductImages, deleteAllProductImages } from '@/lib/utils/image-cleanup-cloudinary';

// Antes de inserir novas imagens (dentro da transação):
if (validated.images) {
  const newCloudinaryIds = validated.images.map(img => img.cloudinaryId);
  await cleanupProductImages(id, newCloudinaryIds);
}
```

**No método DELETE - adicionar cleanup antes de deletar:**

```typescript
import { deleteAllProductImages } from '@/lib/utils/image-cleanup-cloudinary';

// Antes de deletar o produto:
await deleteAllProductImages(id);
```

**Atualizar a validação Zod** (mesma mudança do route.ts principal)

#### 3. **src/app/api/admin/products/[id]/variations/[variationId]/route.ts**

**No método PUT - adicionar cleanup:**

```typescript
import { cleanupVariationImages } from '@/lib/utils/image-cleanup-cloudinary';

// Se atualizar imagens:
if (variationData.images) {
  const newCloudinaryIds = variationData.images.map(img => img.cloudinaryId);
  await cleanupVariationImages(variationId, newCloudinaryIds);
}
```

**No método DELETE - adicionar cleanup:**

```typescript
import { deleteAllVariationImages } from '@/lib/utils/image-cleanup-cloudinary';

// Antes de deletar a variação:
await deleteAllVariationImages(variationId);
```

---

## 🔑 Configuração do Cloudinary

### 1. **Criar conta gratuita**

- Acesse: https://cloudinary.com/users/register_free
- Plano grátis: **25GB storage + 25GB bandwidth/mês**

### 2. **Obter credenciais**

- Login: https://cloudinary.com/console
- Dashboard > Settings > Access Keys
- Copiar:
  - **Cloud Name**
  - **API Key**
  - **API Secret**

### 3. **Adicionar ao `.env.local`**

```bash
# Cloudinary Configuration (Images Only)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
CLOUDINARY_FOLDER=a-rafa-criou
```

⚠️ **ATENÇÃO:** Reinicie o servidor dev após adicionar as variáveis!

---

## 🧪 Testes Recomendados

### 1. **Criar Produto com Imagem**

```
1. Acesse: /admin/produtos
2. Clique em "Novo Produto"
3. Preencha dados + adicione imagem
4. Salvar

✅ Verificar:
- Imagem aparece no Cloudinary (console.cloudinary.com)
- Imagem exibida na lista de produtos
- Imagem exibida na página do produto
- URL da imagem começa com: https://res.cloudinary.com/
```

### 2. **Editar Produto e Trocar Imagem**

```
1. Edite produto existente
2. Remova imagem antiga
3. Adicione imagem nova
4. Salvar

✅ Verificar:
- Imagem ANTIGA foi deletada do Cloudinary
- Imagem NOVA foi adicionada ao Cloudinary
- Imagem nova exibida corretamente
```

### 3. **Deletar Produto**

```
1. Delete um produto com imagens
2. Verificar no Cloudinary

✅ Verificar:
- Todas as imagens foram removidas do Cloudinary
- Produto removido do banco
```

### 4. **Variações com Imagens**

```
Mesmo fluxo para produtos, mas com variações
```

---

## 📁 Estrutura no Cloudinary

```
a-rafa-criou/
├── images/
│   ├── products/
│   │   ├── <cloudinary_id_1>.webp
│   │   ├── <cloudinary_id_2>.webp
│   │   └── ...
│   └── variations/
│       ├── <cloudinary_id_3>.webp
│       └── ...
└── (PDFs continuam no Cloudflare R2, separados!)
```

---

## ✨ Benefícios da Migração

### Performance

- ✅ **CDN Global**: Imagens servidas do edge mais próximo do usuário
- ✅ **Otimização Automática**: WebP, AVIF, resize, compressão
- ✅ **Lazy Loading**: Carregamento progressivo automático
- ✅ **Banco Leve**: Sem base64, queries ~90% mais rápidas

### Escalabilidade

- ✅ **25GB grátis/mês**: Comporta ~25.000 imagens otimizadas
- ✅ **Transformações On-the-Fly**: Resize, crop, watermark sem re-upload
- ✅ **Backups Automáticos**: Cloudinary cuida da redundância

### Manutenção

- ✅ **Painel Visual**: Gerenciar imagens via UI do Cloudinary
- ✅ **Busca Integrada**: Encontrar imagens por tags, metadados
- ✅ **Logs de Acesso**: Análise de uso de imagens

---

## 🚨 Troubleshooting

### **Erro: "Cloudinary não configurado"**

- ✅ Verifique se as 3 variáveis estão no `.env.local`
- ✅ Reinicie o servidor dev: `npm run dev`

### **Imagens não aparecem**

- ✅ Abra Network tab no DevTools
- ✅ Verifique se a URL é `https://res.cloudinary.com/...`
- ✅ Se não, verifique se a API está retornando `img.url`

### **Upload falha**

- ✅ Verifique credenciais Cloudinary
- ✅ Verifique tamanho da imagem (limite: ~10MB)
- ✅ Verifique formato (JPEG, PNG, WebP, GIF)

### **Cleanup não funciona**

- ✅ Verifique se `cleanupProductImages()` foi integrado no PUT
- ✅ Verifique logs no console (servidor Node.js)

---

## 📝 Checklist Final

- [ ] Credenciais Cloudinary adicionadas ao `.env.local`
- [ ] Servidor dev reiniciado
- [ ] Atualizado Zod validation em `/api/admin/products/route.ts`
- [ ] Atualizado insert de imagens em `/api/admin/products/route.ts`
- [ ] Integrado cleanup em `/api/admin/products/[id]/route.ts` (PUT e DELETE)
- [ ] Integrado cleanup em `/api/admin/products/[id]/variations/[variationId]/route.ts`
- [ ] Testado criar produto com imagem
- [ ] Testado editar produto e trocar imagem
- [ ] Testado deletar produto
- [ ] Verificado que imagens antigas foram deletadas do Cloudinary

---

**🎉 Quando tudo estiver marcado, a migração estará completa!**

PDFs continuam no Cloudflare R2 (como antes), imagens agora no Cloudinary (otimizadas e rápidas).
