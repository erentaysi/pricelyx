import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { routes } from '@/lib/routes';
import ProductCard from '@/app/components/ProductCard';
import { Metadata } from 'next';
import Link from 'next/link';

export const revalidate = 3600; // ISR (1 saat)

type Props = {
  params: { slug: string };
};

export async function generateStaticParams() {
  const { data: categories } = await supabase.from('categories').select('slug').not('slug', 'is', null);
  return (categories || []).map((category) => ({
    slug: category.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { data: category } = await supabase
    .from('categories')
    .select('name, slug')
    .eq('slug', params.slug)
    .single();

  if (!category) return { title: 'Bulunamadı' };

  const title = `${category.name} Modelleri, Fiyatları ve İndirimleri | Piinti`;
  const description = routes.seoContent.getCategoryDescription(category.name);
  const canonical = routes.categoryCanonical(params.slug);

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    }
  };
}

export default async function CategoryPage({ params }: Props) {
  const { data: category } = await supabase
    .from('categories')
    .select('id, name, slug, parent_id')
    .eq('slug', params.slug)
    .single();

  if (!category) {
    notFound();
  }

  // Fetch Category Products
  const { data: products } = await supabase
    .from('products')
    .select(`
      id, title, slug, image_url, rating, reviews_count,
      brands (name, slug),
      product_prices (price, vendors(name))
    `)
    .eq('category_id', category.id)
    .order('created_at', { ascending: false })
    .limit(40);

  // Eğer kategoride hiç ürün yoksa boş sayfa oluşturma (Thin Content Koruması)
  if (!products || products.length === 0) {
    notFound();
  }

  // Fetch Related Categories
  const { data: relatedCategories } = await supabase
    .from('categories')
    .select('name, slug')
    .eq('parent_id', category.parent_id || category.id)
    .neq('id', category.id)
    .limit(5);

  // Extract Brands for Internal Linking
  const brands = Array.from(new Set(products.map(p => {
    const b = Array.isArray(p.brands) ? p.brands[0] : p.brands;
    return b?.name;
  }).filter(Boolean)));
  
  const brandSlugs = Array.from(new Set(products.map(p => {
    const b = Array.isArray(p.brands) ? p.brands[0] : p.brands;
    return b?.slug;
  }).filter(Boolean)));

  // Schemas
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: routes.home() },
      { '@type': 'ListItem', position: 2, name: 'Tüm Kategoriler', item: routes.listing() },
      { '@type': 'ListItem', position: 3, name: category.name, item: routes.categoryCanonical(category.slug) }
    ]
  };

  const collectionLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: category.name,
    url: routes.categoryCanonical(category.slug),
    description: routes.seoContent.getCategoryDescription(category.name),
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: products.slice(0, 20).map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: routes.productCanonical(p.slug)
      }))
    }
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd).replace(/</g, '\\u003c') }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionLd).replace(/</g, '\\u003c') }} />

      <div className="bg-slate-50 min-h-screen py-12">
        <div className="container mx-auto px-4 max-w-7xl">
          
          {/* SEO Header */}
          <div className="bg-white rounded-3xl p-8 mb-8 shadow-sm border border-slate-100 fade-in">
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
              {category.name} <span className="text-primary">Fiyatları</span>
            </h1>
            <p className="text-slate-600 max-w-3xl leading-relaxed text-lg">
              {routes.seoContent.getCategoryDescription(category.name)}
            </p>
          </div>

          {/* Internal Links (Brands in Category) */}
          {brands.length > 0 && (
            <div className="mb-8 flex flex-wrap gap-2">
              <span className="text-sm font-bold text-slate-400 py-2 mr-2 uppercase tracking-widest">Popüler Markalar:</span>
              {brandSlugs.map((bs, idx) => (
                <Link key={idx} href={routes.categoryBrand(category.slug, bs as string)} className="bg-white px-4 py-2 rounded-xl text-sm font-bold text-slate-700 hover:text-primary hover:shadow-md transition-all border border-slate-200">
                  {brands[idx]} {category.name}
                </Link>
              ))}
            </div>
          )}

          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Related Categories (Internal Linking) */}
          {relatedCategories && relatedCategories.length > 0 && (
            <div className="mt-16 bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
              <h3 className="text-xl font-black text-slate-900 mb-6 uppercase tracking-tight">Benzer Kategorileri İncele</h3>
              <div className="flex flex-wrap gap-3">
                {relatedCategories.map((rc) => (
                  <Link key={rc.slug} href={routes.category(rc.slug)} className="bg-slate-50 hover:bg-primary/5 text-slate-600 hover:text-primary border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold transition-colors">
                    {rc.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
