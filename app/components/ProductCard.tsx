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
  const rawPrices = product.product_prices || [];
  const prices = Array.isArray(rawPrices) ? rawPrices : [rawPrices];
  const validPrices = prices
    .map((p: any) => {
      if (typeof p.price === 'number') return p.price;
      if (typeof p.price === 'string') {
        let clean = p.price.replace(/[^0-9.,]/g, '');
        if (clean.includes(',') && !clean.includes('.')) clean = clean.replace(',', '.');
        else if (clean.includes(',') && clean.includes('.')) clean = clean.replace(/\./g, '').replace(',', '.');
        return parseFloat(clean) || 0;
      }
      return 0;
    })
    .filter((price: number) => price > 0 && !isNaN(price));
    
  const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : 0;
  
  const trPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(Math.round(price)) + ' ₺';
  };

  const analytics = analyzePriceTrend(product.price_history || [], minPrice);

  const isLG = product.brands?.name?.toLowerCase() === 'lg' || product.brand?.toLowerCase() === 'lg';
  const lgPrice = prices.find((p: any) => p.vendors?.name === 'LG Türkiye' || p.vendor?.name === 'LG Türkiye');
  
  const handleLgClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (lgPrice && lgPrice.vendors) {
      window.open(`/git/${product.id}?vendor=${lgPrice.vendor_id || lgPrice.vendors.id}`, '_blank');
    }
  };

  return (
    <Link href={`/urun/${generateProductSlug(product.title, product.id)}`} className="group h-full">
      <div className="bg-white rounded-3xl border border-slate-100 hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 flex flex-col h-full overflow-hidden relative">
        
        {/* Badges Container */}
        <div className="absolute top-4 left-4 right-4 flex flex-wrap gap-2 z-20 pointer-events-none">
          {product.is_trend && (
            <div className="bg-white/95 backdrop-blur-md text-primary text-[10px] font-black px-3 py-1 rounded-full shadow-sm border border-slate-100 uppercase tracking-widest flex-shrink-0">
              🔥 Trend
            </div>
          )}
          
          {/* Analytics Badge */}
          <div className={`bg-${analytics.color}-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg uppercase tracking-widest flex items-center gap-1 flex-shrink-0`}>
            <span>{analytics.trend === 'best' ? '🔥' : analytics.trend === 'good' ? '🎯' : analytics.trend === 'bad' ? '⏰' : '🔍'}</span> {analytics.title}
          </div>
        </div>

        {/* Image Section */}
        <div className="relative h-56 bg-slate-50 flex items-center justify-center overflow-hidden p-8 pt-12">
          {(!product.image_url || !(product.image_url?.startsWith('http') || product.image_url?.includes('data:image'))) ? (
            <div className="relative w-full h-full opacity-60 mix-blend-multiply group-hover:opacity-100 transition-opacity duration-500">
              <Image src="/logo.jpg" alt="Görsel Bekleniyor" fill className="object-contain p-4" loading="lazy" />
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
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter mb-1">En Düşük Fiyat</span>
              <div className={`text-2xl font-black ${minPrice > 0 ? (analytics.trend === 'best' || analytics.trend === 'good' ? 'text-emerald-600' : analytics.trend === 'bad' ? 'text-rose-600' : 'text-slate-900') : 'text-slate-400 text-lg'}`}>
                {minPrice > 0 ? trPrice(minPrice) : 'Fiyat Güncelleniyor'}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <Database className="w-3 h-3" /> {prices.length > 0 ? `${prices.length} Mağaza` : 'Mağaza Taranıyor'}
              </div>
              {isLG ? (
                <button onClick={handleLgClick} className="bg-[#A50034] text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-[#800028] transition-colors relative z-20 shadow-md flex items-center gap-1">
                  LG.com'da Gör
                </button>
              ) : (
                <div className="text-[10px] font-black text-primary uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                  İncele →
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
