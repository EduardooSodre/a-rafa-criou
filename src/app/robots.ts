import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://arafacriou.com.br';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/auth/',
          '/conta/',
          '/checkout/',
          '/obrigado/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
