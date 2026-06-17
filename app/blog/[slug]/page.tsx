import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Calendar, ArrowLeft, ChevronRight, ShoppingBag, ArrowRight } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const revalidate = 3600;

// SEO Metadata uretimi
export async function generateMetadata({ params }: { params: { slug: string } }) {
  const { data: blog } = await supabase
    .from('blogs')
    .select('title, excerpt, image_url')
    .eq('slug', params.slug)
    .single();

  if (!blog) {
    return { title: 'Bulunamadı | Piinti' };
  }

  return {
    title: `${blog.title} | Piinti Rehber`,
    description: blog.excerpt,
    openGraph: {
      title: blog.title,
      description: blog.excerpt,
      images: blog.image_url ? [blog.image_url] : [],
    },
  };
}

// Basit bir Markdown parser (Sadece h2, h3, bold ve paragraflar icin)
function parseMarkdown(text: string) {
  let html = text
    .replace(/^### (.*$)/gim, '<h3 class="text-2xl font-bold mt-8 mb-4 text-slate-900">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-3xl font-black mt-12 mb-6 text-slate-900">$1</h2>')
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    .replace(/^\> (.*$)/gim, '<blockquote class="border-l-4 border-primary pl-4 italic text-slate-600 my-4">$1</blockquote>')
    .replace(/\n\n/gim, '</p><p class="mb-4 text-slate-700 leading-relaxed text-lg">');
  
  return `<p class="mb-4 text-slate-700 leading-relaxed text-lg">${html}</p>`;
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const { data: blog } = await supabase
    .from('blogs')
    .select('*')
    .eq('slug', params.slug)
    .single();

  if (!blog) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50 pt-24 pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb & Geri Donus */}
        <div className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-8">
          <Link href="/blog" className="hover:text-primary transition-colors flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Tüm Yazılar
          </Link>
          <ChevronRight className="w-4 h-4 text-slate-300" />
          <span className="text-slate-900 truncate">{blog.title}</span>
        </div>

        {/* Baslik Alani */}
        <header className="mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 leading-tight">
            {blog.title}
          </h1>
          <div className="flex items-center gap-4 text-slate-500 font-medium">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {new Date(blog.published_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
        </header>

        {/* Kapak Resmi */}
        {blog.image_url && (
          <div className="rounded-3xl overflow-hidden shadow-2xl mb-16 aspect-[16/9] relative bg-slate-200">
            <img 
              src={blog.image_url} 
              alt={blog.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Icerik */}
        <article 
          className="prose prose-lg prose-slate max-w-none mb-16"
          dangerouslySetInnerHTML={{ __html: parseMarkdown(blog.content) }}
        />

        {/* Harekete Gecirici Mesaj (CTA) */}
        <div className="bg-gradient-to-br from-primary to-emerald-400 rounded-3xl p-8 md:p-12 text-center text-white shadow-2xl shadow-primary/30">
          <ShoppingBag className="w-16 h-16 mx-auto mb-6 opacity-90" />
          <h3 className="text-3xl font-black mb-4">Okuduğunuz Ürünleri Ucuza Alın</h3>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Rehberimizde bahsettiğimiz ürünleri ve çok daha fazlasını Piinti üzerinde karşılaştırarak binlerce lira tasarruf edebilirsiniz.
          </p>
          <Link href="/" className="inline-flex items-center gap-3 bg-white text-primary font-black px-8 py-4 rounded-xl hover:scale-105 transition-transform duration-300">
            Hemen Fiyat Karşılaştır <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

      </div>
    </main>
  );
}
