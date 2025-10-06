# 🔧 Cloudinary - Troubleshooting Rápido

## ❌ Erro: "Falha no upload da imagem para Cloudinary"

### ✅ SOLUÇÃO (passo a passo):

1. **Verifique o `.env.local`** - Deve ter:
   ```bash
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dr2fs6urk
   CLOUDINARY_API_KEY=772792428618415
   CLOUDINARY_API_SECRET=7jPboYhVZ2Nare4d9rRuF1aZvQ8
   CLOUDINARY_FOLDER=a-rafa-criou
   ```

2. **🔴 REINICIE o servidor dev** (OBRIGATÓRIO!):
   ```bash
   # Pare o servidor atual (Ctrl+C)
   # Depois:
   npm run dev
   ```
   
   ⚠️ **Variáveis de ambiente só são carregadas quando o servidor inicia!**

3. **Teste novamente**:
   - Vá em `/admin/produtos`
   - Crie um novo produto
   - Adicione uma imagem
   - Salve

4. **Verifique os logs no terminal** (servidor Node.js):
   - Procure por: `uploadImageToCloudinary - Iniciando...`
   - Procure por: `Upload bem-sucedido:`
   - Se houver erro, verifique a mensagem detalhada

---

## 🔍 Verificações Adicionais

### A) Credenciais Cloudinary corretas?
- Login: https://cloudinary.com/console
- Dashboard > Settings > Access Keys
- Confira se os valores batem com o `.env.local`

### B) Variáveis carregadas?
Adicione temporariamente no início do `src/lib/cloudinary.ts`:
```typescript
console.log('Cloudinary Config:', {
  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  hasApiKey: !!process.env.CLOUDINARY_API_KEY,
  hasApiSecret: !!process.env.CLOUDINARY_API_SECRET,
});
```

### C) Formato da imagem OK?
- Formatos suportados: JPEG, PNG, WebP, GIF
- Tamanho máximo recomendado: 10MB
- Se a imagem for muito grande, reduza antes do upload

---

## 📝 Logs que Você Deve Ver

### ✅ Sucesso:
```
uploadImageToCloudinary - Iniciando...
Fazendo upload para: a-rafa-criou/images/products
Upload bem-sucedido: { publicId: '...', format: 'webp', size: 123456 }
```

### ❌ Erro de Configuração:
```
Cloudinary não configurado. Variáveis faltando: { cloudName: false, ... }
```
→ **Solução**: Verifique `.env.local` e reinicie o servidor

### ❌ Erro de Autenticação:
```
Unauthorized (401)
```
→ **Solução**: Faça login no sistema antes de criar produto

### ❌ Erro de Credenciais:
```
Invalid API credentials
```
→ **Solução**: Verifique API Key e API Secret no Cloudinary Console

---

## 🎯 Checklist Rápido

- [ ] `.env.local` tem as 4 variáveis do Cloudinary
- [ ] Variáveis começam com `NEXT_PUBLIC_` (cloud_name) e `CLOUDINARY_` (api_key, api_secret)
- [ ] Servidor dev foi **reiniciado** após editar `.env.local`
- [ ] Credenciais são válidas (testar no Cloudinary Console)
- [ ] Você está logado como **admin** no sistema

---

## 🚀 Depois que Funcionar

1. **Verifique no Cloudinary**:
   - https://cloudinary.com/console/media_library
   - Pasta: `a-rafa-criou/images/products/`
   - Deve aparecer a imagem enviada

2. **Verifique no frontend**:
   - Lista de produtos (admin)
   - Página do produto
   - URL da imagem deve ser: `https://res.cloudinary.com/dr2fs6urk/image/upload/...`

3. **Remova os logs de debug** (opcional):
   - Retire os `console.log()` adicionados em `cloudinary.ts` e `upload/route.ts`

---

**Problema persiste? Compartilhe os logs completos do terminal!**
