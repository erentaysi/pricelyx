import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';
import { ChevronRight, Calendar, ArrowLeft } from 'lucide-react';
import { Metadata } from 'next';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { data: blog } = await supabase
    .from('blogs')
    .select('title, excerpt, image_url, published_at')
    .eq('slug', params.slug)
    .single();

  if (!blog) return { title: 'Bulunamadı | Piinti' };

  return {
    title: `${blog.title} | Piinti Blog`,
    description: blog.excerpt,
    openGraph: {
      title: blog.title,
      description: blog.excerpt,
      type: 'article',
      publishedTime: blog.published_at,
      images: blog.image_url ? [blog.image_url] : [],
    }
  };
}

export default async function BlogDetailPage({ params }: { params: { slug: string } }) {
  const { data: blog } = await supabase
    .from('blogs')
    .select('*')
    .eq('slug', params.slug)
    .single();

  if (!blog) {
    notFound();
  }

  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: blog.title,
    image: blog.image_url ? [blog.image_url] : [],
    datePublished: blog.published_at,
    dateModified: blog.published_at,
    author: [{
        '@type': 'Organization',
        name: 'Piinti Yapay Zeka',
        url: 'https://www.piinti.com'
    }],
    publisher: {
      '@type': 'Organization',
      name: 'Piinti',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.piinti.com/icon.png'
      }
    },
    description: blog.excerpt
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: 'https://www.piinti.com' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://www.piinti.com/blog' },
      { '@type': 'ListItem', position: 3, name: blog.title }
    ]
  };

  return (
    <main className="min-h-screen bg-white pb-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([articleLd, breadcrumbLd]) }} />
      
      {/* Blog Hero Image */}
      <div className="w-full h-[40vh] md:h-[60vh] relative bg-slate-900">
        <img 
          src={blog.image_url || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1600&q=80'} 
          alt={blog.title} 
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-32 relative z-10">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-200 mb-8 drop-shadow-md">
          <Link href="/" className="hover:text-white transition-colors">Ana Sayfa</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-white/70 line-clamp-1">{blog.title}</span>
        </div>

        <article className="bg-white rounded-[3rem] p-8 md:p-16 shadow-2xl shadow-slate-200/50 border border-slate-100">
          <header className="mb-12 border-b border-slate-100 pb-12 text-center">
            <div className="inline-flex items-center gap-2 text-primary font-bold text-sm bg-primary/10 px-4 py-2 rounded-full mb-6 uppercase tracking-widest">
              <Calendar className="w-4 h-4" />
              {new Date(blog.published_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight mb-6">
              {blog.title}
            </h1>
            <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-2xl mx-auto">
              {blog.excerpt}
            </p>
          </header>

          <div className="prose prose-slate prose-lg md:prose-xl max-w-none prose-headings:font-black prose-headings:tracking-tight prose-a:text-primary hover:prose-a:text-primary/80 prose-img:rounded-3xl prose-img:shadow-xl">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                h2: ({node, ...props}) => <h2 className="text-3xl font-black text-slate-900 mt-16 mb-6" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-2xl font-bold text-slate-800 mt-12 mb-4" {...props} />,
                p: ({node, ...props}) => <p className="text-slate-600 leading-loose mb-8 text-lg" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc pl-6 text-slate-600 mb-8 space-y-3" {...props} />,
                li: ({node, ...props}) => <li className="leading-relaxed" {...props} />,
                a: ({node, ...props}) => <a className="text-primary font-bold underline decoration-2 underline-offset-4" {...props} />,
                strong: ({node, ...props}) => <strong className="font-black text-slate-900" {...props} />,
                blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-primary pl-6 py-2 my-8 text-slate-500 italic font-medium bg-slate-50 rounded-r-xl" {...props} />,
              }}
            >
              {blog.content}
            </ReactMarkdown>
          </div>
        </article>

        <div className="mt-12 text-center">
          <Link href="/blog" className="inline-flex items-center gap-3 bg-slate-100 hover:bg-slate-200 text-slate-600 px-8 py-4 rounded-2xl font-bold text-sm uppercase tracking-widest transition-colors">
            <ArrowLeft className="w-5 h-5" /> Blog'a Dön
          </Link>
        </div>

      </div>
    </main>
  );
}
