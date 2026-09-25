import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://makwatches.in';
  
  // Static routes
  const staticRoutes = [
    '',
    '/shop',
    '/men',
    '/women',
    '/about',
    '/contact',
    '/blog',
    '/terms',
    '/privacy',
    '/shipping',
    '/replacement',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'daily' as const : 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // Category routes
  const categoryRoutes = [
    '/men',
    '/women',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.9,
  }));

  return [
    ...staticRoutes,
    ...categoryRoutes,
    // You can add dynamic product routes here by fetching from your API
    // Example:
    // ...products.map((product) => ({
    //   url: `${baseUrl}/product_details?id=${product.id}`,
    //   lastModified: product.updatedAt,
    //   changeFrequency: 'weekly' as const,
    //   priority: 0.7,
    // })),
  ];
}
