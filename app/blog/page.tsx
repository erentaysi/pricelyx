import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Calendar, BookOpen } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const revalidate = 0; // Dinamik sayfa, anında yenilenir

export const metadata = {
  title: 'Blog & Rehber | En Ucuz Fiyatları Bulmadan Önce Okuyun - Piinti',
  description: 'Telefon, bilgisayar, robot süpürge ve daha birçok teknolojik ürün için detaylı satın alma rehberleri ve incelemeler.',
};

export default async function BlogIndexPage() {
  const { data: blogs } = await supabase
    .from('blogs')
    .select('title, slug, excerpt, image_url, published_at')
    .order('published_at', { ascending: false });

  return (
    <main className="min-h-screen bg-slate-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Başlık Alanı */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 font-bold text-sm mb-6">
            <BookOpen className="w-4 h-4" /> REHBER & İNCELEME
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight">
            Alışveriş Rehberi
          </h1>
          <p className="text-xl text-slate-600 font-medium">
            Paranızı çöpe atmamak için en doğru ürünleri seçmenize yardımcı olacak rehberlerimizi inceleyin.
          </p>
        </div>

        {/* Blog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogs?.map((blog) => (
            <Link 
              key={blog.slug} 
              href={`/blog/${blog.slug}`}
              className="group bg-white rounded-3xl overflow-hidden shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col"
            >
              {/* Görsel */}
              <div className="aspect-[16/10] relative overflow-hidden bg-slate-100">
                <Image 
                  src={blog.image_url || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80'} 
                  alt={blog.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>

              {/* İçerik */}
              <div className="p-8 flex flex-col flex-grow">
                <div className="flex items-center gap-2 text-slate-400 text-sm font-medium mb-4">
                  <Calendar className="w-4 h-4" />
                  {new Date(blog.published_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
                
                <h2 className="text-2xl font-black text-slate-900 mb-4 line-clamp-2 group-hover:text-primary transition-colors">
                  {blog.title}
                </h2>
                
                <p className="text-slate-600 line-clamp-3 mb-8 flex-grow">
                  {blog.excerpt}
                </p>

                <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-widest mt-auto group-hover:gap-4 transition-all">
                  Devamını Oku <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </main>
  );
}
