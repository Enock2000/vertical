import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://vshr.oraninvestments.com';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard/', '/employee-portal/', '/portals/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
