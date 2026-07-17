/**
 * Piinti Centralized SEO Layer
 * 
 * Tüm sayfaların Metadata, Canonical URL, OpenGraph ve Schema.org (JSON-LD)
 * üretimleri bu merkezden yönetilir. 
 * İleride SEO stratejisi değiştiğinde sadece burası güncellenir.
 */
import { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://piinti.com';
const SITE_NAME = 'Piinti';

// ─── Metadata & OpenGraph ──────────────────────────────────────

interface SeoMetadataParams {
  title: string;
  description: string;
  path: string;
  imageUrl?: string;
  noindex?: boolean;
}

export function generateSeoMetadata({ title, description, path, imageUrl, noindex = false }: SeoMetadataParams): Metadata {
  const url = `${SITE_URL}${path}`;
  const defaultImage = `${SITE_URL}/og-image.jpg`;

  return {
    title: `${title} | ${SITE_NAME}`,
    description,
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: url,
    },
    robots: {
      index: !noindex,
      follow: !noindex,
      googleBot: {
        index: !noindex,
        follow: !noindex,
      },
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      images: [
        {
          url: imageUrl || defaultImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: 'tr_TR',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl || defaultImage],
    },
  };
}

// ─── Schema.org (JSON-LD) Generators ────────────────────────────

export function generateProductSchema(product: {
  title: string;
  description: string;
  imageUrl: string;
  url: string;
  brandName?: string;
  categoryName?: string;
  rating?: number;
  reviewCount?: number;
  offers: { price: number; vendorUrl: string; vendorName: string }[];
}) {
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description,
    image: product.imageUrl,
    url: product.url,
  };

  if (product.brandName) {
    schema.brand = { '@type': 'Brand', name: product.brandName };
  }

  if (product.categoryName) {
    schema.category = product.categoryName;
  }

  if (product.rating && product.reviewCount && product.reviewCount > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: product.rating.toFixed(1),
      reviewCount: product.reviewCount,
      bestRating: '5',
      worstRating: '1',
    };
  }

  if (product.offers.length > 0) {
    const lowPrice = Math.min(...product.offers.map(o => o.price));
    const highPrice = Math.max(...product.offers.map(o => o.price));

    schema.offers = {
      '@type': 'AggregateOffer',
      url: product.url,
      priceCurrency: 'TRY',
      lowPrice: lowPrice,
      highPrice: highPrice,
      offerCount: product.offers.length,
      offers: product.offers.map(offer => ({
        '@type': 'Offer',
        price: offer.price,
        priceCurrency: 'TRY',
        url: offer.vendorUrl,
        seller: {
          '@type': 'Organization',
          name: offer.vendorName
        }
      }))
    };
  }

  return JSON.stringify(schema);
}

export function generateBreadcrumbSchema(items: { name: string; item: string }[]) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.item}`
    }))
  });
}
