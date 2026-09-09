import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/sagrado', '/minha-inscricao', '/api/'],
      },
    ],
    sitemap: 'https://cancaoprofana.vercel.app/sitemap.xml',
  };
}
