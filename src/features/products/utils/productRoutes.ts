import type { AgriculturalProduct } from '../types/product';

export function getProductPath(slug: string): string {
  return `/products/${slug}`;
}

export function getProductsDirectoryPath(): string {
  return '/products';
}

/**
 * Build investment map deep-link using the existing public map query architecture.
 * Zone is preserved as the geographic authority; commodity/metric are additive.
 */
export function getInvestmentMapPathForProduct(
  product: Pick<AgriculturalProduct, 'investmentCommodityKey'>,
  options?: { zoneId?: string; metric?: string }
): string {
  const params = new URLSearchParams();
  const commodity = product.investmentCommodityKey?.trim();
  if (commodity) {
    params.set('commodity', commodity);
  }
  params.set('metric', options?.metric || 'production');
  if (options?.zoneId) {
    params.set('zone', options.zoneId);
  }
  const qs = params.toString();
  return qs ? `/investment/map?${qs}` : '/investment/map';
}

export function getInvestmentMapPathForZone(
  commodityKey: string | undefined,
  zoneId: string,
  metric: string = 'production'
): string {
  const params = new URLSearchParams();
  if (commodityKey) params.set('commodity', commodityKey);
  params.set('metric', metric);
  params.set('zone', zoneId);
  return `/investment/map?${params.toString()}`;
}
