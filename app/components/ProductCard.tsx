"use client";

import Link from "next/link";
import Image from "next/image";
import { Database, Star } from "lucide-react";
import { generateProductSlug } from "@/lib/utils";
import { analyzePriceTrend } from "@/lib/analytics";

interface ProductCardProps {
  product: any;
}

export default function ProductCard({ product }: ProductCardProps) {
  const prices = product.product_prices || [];
  const minPrice = prices.length > 0 ? Math.min(...prices.map((p: any) => p.price)) : 0;
  
  const trPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(Math.round(price)) + ' ₺';
  };

  const analytics = analyzePriceTrend(product.price_history || [], minPrice);

  return (
    <Link href={`/urun/${generateProductSlug(product.title, product.id)}`} className="group h-full">
      <div className="bg-white rounded-3xl border border-slate-100 hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 flex flex-col h-full overflow-hidden relative">
        
        {/* Analytics Badge */}
        <div className={`absolute top-4 right-4 ${analytics.trend === 'bad' ? 'bg-rose-500' : analytics.color} text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg z-10 uppercase tracking-widest flex items-center gap-1 scale-90 origin-right group-hover:scale-100 transition-transform`}>
          <span>{analytics.icon}</span> {analytics.message}
        </div>

        {/* Image Section */}
        <div className="relative h-56 bg-slate-50 flex items-center justify-center overflow-hidden p-8">
          {(!product.image_url || !(product.image_url?.startsWith('http') || product.image_url?.includes('data:image'))) ? (
            <div className="relative w-full h-full opacity-60 mix-blend-multiply group-hover:opacity-100 transition-opacity duration-500">
              <Image src="/placeholder.png" alt="Görsel Bekleniyor" fill className="object-contain p-4" loading="lazy" />
            </div>
          ) : (
            <div className="relative w-full h-full">
              <Image 
                src={product.image_url.replace('http://', 'https://')} 
                alt={`${product.title} - En Uygun Fiyatlarla Piinti'de`}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-contain group-hover:scale-110 transition-transform duration-500" 
                loading="lazy"
              />
            </div>
          )}
          
          {product.is_trend && (
            <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md text-primary text-[10px] font-black px-3 py-1 rounded-full shadow-sm border border-slate-100 z-10 uppercase tracking-widest">
              🔥 Trend
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-6 flex flex-col flex-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black text-primary uppercase tracking-widest">{product.brands?.name || product.brand || 'Bilinmiyor'}</span>
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
              <span className="text-xs font-bold text-slate-700">{product.rating || '4.8'}</span>
            </div>
          </div>
          
          <h3 className="font-bold text-slate-800 mb-4 line-clamp-2 h-12 text-base leading-tight group-hover:text-primary transition-colors">
            {product.title}
          </h3>

          <div className="mt-auto">
            <div className="flex flex-col mb-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">En Düşük Fiyat</span>
              <div className={`text-2xl font-black ${analytics.trend === 'best' || analytics.trend === 'good' ? 'text-emerald-600' : analytics.trend === 'bad' ? 'text-rose-600' : 'text-slate-900'}`}>
                {minPrice > 0 ? trPrice(minPrice) : 'Fiyat Yok'}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <Database className="w-3 h-3" /> {prices.length || 1} Mağaza
              </div>
              <div className="text-[10px] font-black text-primary uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                İncele →
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
