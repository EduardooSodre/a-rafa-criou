import { MetadataRoute } from 'next';
import { db } from '@/lib/db';
import { products } from '@/lib/db/schema';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://arafacriou.com.br';

  // Buscar todos os produtos
  const allProducts = await db.select({
    slug: products.slug,
    updatedAt: products.updatedAt,
  }).from(products);

  // Páginas estáticas
  const routes = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/produtos`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/contato`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/carrinho`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    },
  ];

  // Páginas de produtos dinâmicas
  const productRoutes = allProducts.map((product) => ({
    url: `${baseUrl}/produtos/${product.slug}`,
    lastModified: product.updatedAt || new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [...routes, ...productRoutes];
}
