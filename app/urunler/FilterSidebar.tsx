"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function FilterSidebar({ 
  categories, 
  brands, 
  currentCat, 
  currentBrand, 
  currentQ,
  currentMinPrice,
  currentMaxPrice,
  currentSort
}: { 
  categories: any[], 
  brands: any[], 
  currentCat?: string, 
  currentBrand?: string,
  currentQ?: string,
  currentMinPrice?: string,
  currentMaxPrice?: string,
  currentSort?: string
}) {
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [openCategories, setOpenCategories] = useState<Record<number, boolean>>({});
  const [showAllBrands, setShowAllBrands] = useState(false);

  // Fiyat state'i
  const [minPrice, setMinPrice] = useState(currentMinPrice || "");
  const [maxPrice, setMaxPrice] = useState(currentMaxPrice || "");

  const toggleCategory = (id: number) => {
    setOpenCategories(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const updateFilters = (key: string, value: string | null) => {
    const params = new URLSearchParams();
    if (currentQ) params.set('q', currentQ);
    if (currentCat) params.set('cat', currentCat);
    if (currentBrand) params.set('brand', currentBrand);
    if (currentMinPrice) params.set('min_price', currentMinPrice);
    if (currentMaxPrice) params.set('max_price', currentMaxPrice);
    if (currentSort) params.set('sort', currentSort);

    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    router.push(`/urunler?${params.toString()}`);
  };

  const applyPriceFilter = () => {
    const params = new URLSearchParams();
    if (currentQ) params.set('q', currentQ);
    if (currentCat) params.set('cat', currentCat);
    if (currentBrand) params.set('brand', currentBrand);
    
    if (minPrice) params.set('min_price', minPrice);
    if (maxPrice) params.set('max_price', maxPrice);

    router.push(`/urunler?${params.toString()}`);
    if (isMobileOpen) setIsMobileOpen(false);
  };

  const clearAllFilters = () => {
    router.push('/urunler');
    setIsMobileOpen(false);
    setMinPrice("");
    setMaxPrice("");
  };

  const displayedBrands = showAllBrands ? brands : brands.slice(0, 10);

  return (
    <>
      {/* Mobil Filtre Butonu */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <button 
          onClick={() => setIsMobileOpen(true)}
          className="bg-slate-900 text-white px-8 py-3 rounded-full font-bold shadow-xl shadow-slate-900/20 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
          Filtrele
        </button>
      </div>

      {/* Mobil Arkaplan Karartma */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50" onClick={() => setIsMobileOpen(false)}></div>
      )}

      {/* Sidebar / Modal */}
      <aside className={`
        fixed md:sticky top-0 md:top-24 bottom-0 left-0 right-0 md:right-auto z-50 md:z-10
        w-full md:w-72 flex-shrink-0 bg-white md:bg-transparent
        transform transition-transform duration-300 ease-in-out
        ${isMobileOpen ? 'translate-y-0 mt-20 rounded-t-3xl shadow-2xl' : 'translate-y-full md:translate-y-0'}
      `}>
        <div className="bg-white md:shadow-lg md:rounded-2xl p-6 h-full md:h-auto overflow-y-auto border-t md:border border-slate-100 hide-scrollbar pb-32 md:pb-6">
          
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-black text-xl text-slate-800 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
              Filtreler
            </h2>
            <div className="flex items-center gap-2">
              {(currentCat || currentBrand || currentMinPrice || currentMaxPrice || currentQ) && (
                <button onClick={clearAllFilters} className="text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 px-2 py-1 rounded">Temizle</button>
              )}
              <button onClick={() => setIsMobileOpen(false)} className="md:hidden p-2 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>
          
          {currentQ && (
            <div className="mb-6 p-3 bg-blue-50 text-blue-800 text-sm rounded-lg flex items-center justify-between border border-blue-100">
               <span>Arama: <b>{currentQ}</b></span>
               <button onClick={() => updateFilters('q', null)} className="text-xl font-bold leading-none hover:text-red-500">&times;</button>
            </div>
          )}

          {/* Kategori Accordion */}
          <div className="mb-8 border-b border-slate-100 pb-6">
            <h3 className="font-bold mb-4 text-slate-800 flex items-center justify-between">
              Kategori
            </h3>
            <div className="space-y-1">
              <label className={`flex items-center gap-3 cursor-pointer p-2 rounded-lg transition-colors ${!currentCat ? 'bg-primary/5 text-primary' : 'hover:bg-slate-50 text-slate-600'}`}>
                <input 
                  type="radio" 
                  name="kategori" 
                  className="hidden"
                  onChange={() => updateFilters('cat', null)}
                  checked={!currentCat}
                />
                <div className={`w-4 h-4 rounded border flex items-center justify-center ${!currentCat ? 'border-primary bg-primary' : 'border-slate-300'}`}>
                  {!currentCat && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                </div>
                <span className="text-sm font-semibold">Tüm Kategoriler</span>
              </label>

              {categories.map(main => {
                const isOpen = openCategories[main.id];
                const hasActiveSub = main.subs?.some((sub: any) => sub.slug === currentCat);
                const hasSubs = main.subs && main.subs.length > 0;
                
                return (
                  <div key={main.id} className="pt-1">
                    <button 
                      onClick={() => {
                        if (hasSubs) {
                           toggleCategory(main.id);
                        } else {
                           updateFilters('cat', main.slug);
                           if (isMobileOpen) setIsMobileOpen(false);
                        }
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-sm font-semibold transition-all ${hasActiveSub || currentCat === main.slug ? 'text-primary bg-primary/5' : 'text-slate-700 hover:bg-slate-50'}`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{main.icon}</span> {main.name}
                      </span>
                      {hasSubs && (
                        <svg className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                      )}
                    </button>
                    
                    {isOpen && main.subs && (
                      <div className="pl-6 pr-2 mt-1 space-y-1 border-l-2 border-slate-100 ml-4 py-1">
                        {main.subs.map((sub: any) => (
                          <label key={sub.slug} className={`flex items-center gap-3 cursor-pointer p-2 rounded-lg transition-colors ${currentCat === sub.slug ? 'bg-slate-100 text-slate-900' : 'hover:bg-slate-50 text-slate-500'}`}>
                            <input 
                              type="radio" 
                              name="kategori" 
                              className="hidden"
                              onChange={() => {
                                updateFilters('cat', sub.slug);
                                if (isMobileOpen) setIsMobileOpen(false);
                              }}
                              checked={currentCat === sub.slug}
                            />
                            <div className={`w-3 h-3 rounded-full flex items-center justify-center ${currentCat === sub.slug ? 'border-4 border-primary' : 'border-2 border-slate-300'}`}>
                            </div>
                            <span className={`text-sm ${currentCat === sub.slug ? 'font-bold' : 'font-medium'}`}>{sub.name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Marka Filtresi */}
          <div className="mb-8 border-b border-slate-100 pb-6">
            <h3 className="font-bold mb-4 text-slate-800">Marka</h3>
            <div className="space-y-1">
              <label className={`flex items-center gap-3 cursor-pointer p-2 rounded-lg transition-colors ${!currentBrand ? 'bg-primary/5 text-primary' : 'hover:bg-slate-50 text-slate-600'}`}>
                <input 
                  type="radio" 
                  name="marka" 
                  className="hidden"
                  onChange={() => updateFilters('brand', null)}
                  checked={!currentBrand}
                />
                <div className={`w-4 h-4 rounded border flex items-center justify-center ${!currentBrand ? 'border-primary bg-primary' : 'border-slate-300'}`}>
                  {!currentBrand && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                </div>
                <span className="text-sm font-semibold">Tümü</span>
              </label>
              
              {displayedBrands.map(brand => (
                <label key={brand.name} className={`flex items-center gap-3 cursor-pointer p-2 rounded-lg transition-colors ${currentBrand === brand.name ? 'bg-slate-100 text-slate-900' : 'hover:bg-slate-50 text-slate-500'}`}>
                  <input 
                    type="radio" 
                    name="marka" 
                    className="hidden"
                    onChange={() => {
                      updateFilters('brand', brand.name);
                      if (isMobileOpen) setIsMobileOpen(false);
                    }}
                    checked={currentBrand === brand.name}
                  />
                  <div className={`w-3 h-3 rounded-full flex items-center justify-center ${currentBrand === brand.name ? 'border-4 border-primary' : 'border-2 border-slate-300'}`}>
                  </div>
                  <span className={`text-sm ${currentBrand === brand.name ? 'font-bold' : 'font-medium'}`}>{brand.name}</span>
                </label>
              ))}
            </div>
            
            {brands.length > 10 && (
              <button 
                onClick={() => setShowAllBrands(!showAllBrands)}
                className="mt-3 text-sm font-bold text-primary hover:text-primary/80 flex items-center gap-1 w-full p-2"
              >
                {showAllBrands ? 'Daha Az Göster' : `Tümünü Gör (${brands.length})`}
              </button>
            )}
          </div>

          {/* Fiyat Aralığı Filtresi */}
          <div>
            <h3 className="font-bold mb-4 text-slate-800">Fiyat Aralığı</h3>
            <div className="flex items-center gap-2 mb-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₺</span>
                <input 
                  type="number" 
                  placeholder="En Az"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              <span className="text-slate-400">-</span>
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₺</span>
                <input 
                  type="number" 
                  placeholder="En Çok"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>
            <button 
              onClick={applyPriceFilter}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-xl text-sm transition-colors"
            >
              Uygula
            </button>
          </div>

          {/* Sıralama */}
          <div className="pt-6 mt-6 border-t border-slate-100">
            <h3 className="font-bold mb-4 text-slate-800">Sıralama</h3>
            <div className="flex flex-col gap-2">
              <label className={`flex items-center gap-3 cursor-pointer p-2 rounded-lg transition-colors ${(!currentSort || currentSort === 'newest') ? 'bg-slate-100 text-slate-900' : 'hover:bg-slate-50 text-slate-500'}`}>
                <input 
                  type="radio" 
                  name="sort" 
                  className="hidden"
                  onChange={() => {
                    updateFilters('sort', 'newest');
                    if (isMobileOpen) setIsMobileOpen(false);
                  }}
                  checked={!currentSort || currentSort === 'newest'}
                />
                <div className={`w-3 h-3 rounded-full flex items-center justify-center ${(!currentSort || currentSort === 'newest') ? 'border-4 border-primary' : 'border-2 border-slate-300'}`}></div>
                <span className={`text-sm ${(!currentSort || currentSort === 'newest') ? 'font-bold' : 'font-medium'}`}>En Yeniler</span>
              </label>
              
              <label className={`flex items-center gap-3 cursor-pointer p-2 rounded-lg transition-colors ${currentSort === 'price_asc' ? 'bg-slate-100 text-slate-900' : 'hover:bg-slate-50 text-slate-500'}`}>
                <input 
                  type="radio" 
                  name="sort" 
                  className="hidden"
                  onChange={() => {
                    updateFilters('sort', 'price_asc');
                    if (isMobileOpen) setIsMobileOpen(false);
                  }}
                  checked={currentSort === 'price_asc'}
                />
                <div className={`w-3 h-3 rounded-full flex items-center justify-center ${currentSort === 'price_asc' ? 'border-4 border-primary' : 'border-2 border-slate-300'}`}></div>
                <span className={`text-sm ${currentSort === 'price_asc' ? 'font-bold' : 'font-medium'}`}>Artan Fiyat (En Ucuz)</span>
              </label>

              <label className={`flex items-center gap-3 cursor-pointer p-2 rounded-lg transition-colors ${currentSort === 'price_desc' ? 'bg-slate-100 text-slate-900' : 'hover:bg-slate-50 text-slate-500'}`}>
                <input 
                  type="radio" 
                  name="sort" 
                  className="hidden"
                  onChange={() => {
                    updateFilters('sort', 'price_desc');
                    if (isMobileOpen) setIsMobileOpen(false);
                  }}
                  checked={currentSort === 'price_desc'}
                />
                <div className={`w-3 h-3 rounded-full flex items-center justify-center ${currentSort === 'price_desc' ? 'border-4 border-primary' : 'border-2 border-slate-300'}`}></div>
                <span className={`text-sm ${currentSort === 'price_desc' ? 'font-bold' : 'font-medium'}`}>Azalan Fiyat (En Pahalı)</span>
              </label>
            </div>
          </div>

        </div>
      </aside>
    </>
  );
}
