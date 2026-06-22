import { redirect, permanentRedirect, notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { extractIdFromSlug } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function UrunRedirect({ params }: { params: { id: string } }) {
  const actualId = extractIdFromSlug(params.id);
  
  if (!actualId) {
    notFound();
  }

  const { data: product } = await supabase
    .from('products')
    .select('slug')
    .eq('id', actualId)
    .single();

  if (!product || !product.slug) {
    notFound();
  }

  // 308 Permanent Redirect to the new SEO slug route
  permanentRedirect(`/urunler/${product.slug}`);
}
