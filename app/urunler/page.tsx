"use client";

import { useState } from "react";
import { MOCK_PRODUCTS, MOCK_CATEGORIES, MOCK_BRANDS } from "@/data/mock";
import Link from "next/link";

export default function UrunlerPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);

  const filteredProducts = MOCK_PRODUCTS.filter((product) => {
    if (selectedCategory && product.category !== selectedCategory) return false;
    if (selectedBrand && product.brand !== selectedBrand) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row gap-8">
      {/* Sidebar Filters */}
      <aside className="w-full md:w-64 flex-shrink-0">
        <div className="bg-white shadow rounded-2xl p-6 sticky top-24 border border-slate-100">
          <h2 className="font-black text-xl mb-6">Filtreler</h2>
          
          <div className="mb-6">
            <h3 className="font-bold mb-3 text-slate-700 dark:text-slate-300">Kategori</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="kategori" 
                  className="accent-brand"
                  onChange={() => setSelectedCategory(null)}
                  checked={selectedCategory === null}
                />
                <span className="text-sm">Tümü</span>
              </label>
              {MOCK_CATEGORIES.map(cat => (
                <label key={cat} className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="kategori" 
                    className="accent-brand"
                    onChange={() => setSelectedCategory(cat)}
                    checked={selectedCategory === cat}
                  />
                  <span className="text-sm">{cat}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-bold mb-3 text-slate-700 dark:text-slate-300">Marka</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="marka" 
                  className="accent-brand"
                  onChange={() => setSelectedBrand(null)}
                  checked={selectedBrand === null}
                />
                <span className="text-sm">Tümü</span>
              </label>
              {MOCK_BRANDS.map(brand => (
                <label key={brand} className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="marka" 
                    className="accent-brand"
                    onChange={() => setSelectedBrand(brand)}
                    checked={selectedBrand === brand}
                  />
                  <span className="text-sm">{brand}</span>
                </label>
              ))}
            </div>
          </div>

        </div>
      </aside>

      {/* Product List */}
      <div className="flex-1">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold">
            {selectedCategory ? `${selectedCategory} Ürünleri` : "Tüm Ürünler"} 
            <span className="text-slate-500 text-base font-normal ml-2">({filteredProducts.length} sonuç)</span>
          </h1>
          <select className="bg-white shadow border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none">
            <option>Önerilen Sıralama</option>
            <option>En Düşük Fiyat</option>
            <option>En Yüksek Fiyat</option>
            <option>En Çok Yorumlanan</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProducts.map(product => (
            <Link href={`/urun/${product.id}`} key={product.id}>
              <div className="glass rounded-2xl p-5 hover:shadow-xl hover:border-brand/30 transition-all cursor-pointer group flex flex-col h-full">
                <div className="bg-slate-100 dark:bg-dark-bg/50 rounded-xl h-48 mb-4 flex items-center justify-center p-4">
                  <span className="text-6xl grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500">
                    {product.image}
                  </span>
                </div>
                <div className="flex-1">
                  <span className="text-xs text-brand font-semibold mb-1 block">{product.brand}</span>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-2 leading-tight group-hover:text-brand transition-colors line-clamp-2">{product.title}</h3>
                  <div className="flex items-center gap-1 text-xs text-slate-500 mb-4">
                    <span className="text-yellow-500">★</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{product.rating}</span>
                    <span>({product.reviewsCount})</span>
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">{product.basePrice.toLocaleString("tr-TR")} TL</div>
                  <div className="mt-3 text-xs font-semibold text-slate-500 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/><path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9"/><path d="M12 3v6"/></svg>
                    {product.prices.length} mağazada
                  </div>
                </div>
              </div>
            </Link>
          ))}
          {filteredProducts.length === 0 && (
            <div className="col-span-full text-center py-20 text-slate-500">
              Bu kriterlere uygun ürün bulunamadı.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
