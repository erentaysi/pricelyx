"use client";

import { useRouter } from "next/navigation";

export default function FilterSidebar({ categories, brands, currentCat, currentBrand, currentQ }: { 
  categories: any[], 
  brands: any[], 
  currentCat?: string, 
  currentBrand?: string,
  currentQ?: string
}) {
  const router = useRouter();

  const updateFilters = (key: string, value: string | null) => {
    const params = new URLSearchParams();
    if (currentQ) params.set('q', currentQ);
    if (currentCat) params.set('cat', currentCat);
    if (currentBrand) params.set('brand', currentBrand);

    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    router.push(`/urunler?${params.toString()}`);
  }

  return (
    <aside className="w-full md:w-64 flex-shrink-0">
      <div className="bg-white shadow rounded-2xl p-6 sticky top-24 border border-slate-100">
        <h2 className="font-black text-xl mb-6 text-slate-800">Filtreler</h2>
        
        {currentQ && (
          <div className="mb-6 p-3 bg-blue-50 text-blue-800 text-sm rounded-lg flex items-center justify-between border border-blue-100">
             <span>Arama: <b>{currentQ}</b></span>
             <button onClick={() => updateFilters('q', null)} className="text-xl font-bold leading-none hover:text-red-500">&times;</button>
          </div>
        )}

        <div className="mb-6">
          <h3 className="font-bold mb-3 text-slate-700">Kategori</h3>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                name="kategori" 
                className="accent-brand"
                onChange={() => updateFilters('cat', null)}
                checked={!currentCat}
              />
              <span className="text-sm text-slate-600 font-medium">Tümü</span>
            </label>
            {categories.map(cat => (
              <label key={cat.slug} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded-md transition-colors">
                <input 
                  type="radio" 
                  name="kategori" 
                  className="accent-brand"
                  onChange={() => updateFilters('cat', cat.slug)}
                  checked={currentCat === cat.slug}
                />
                <span className="text-sm text-slate-600 font-medium">{cat.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-bold mb-3 text-slate-700">Marka</h3>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                name="marka" 
                className="accent-brand"
                onChange={() => updateFilters('brand', null)}
                checked={!currentBrand}
              />
              <span className="text-sm text-slate-600 font-medium">Tümü</span>
            </label>
            {brands.map(brand => (
              <label key={brand.name} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded-md transition-colors">
                <input 
                  type="radio" 
                  name="marka" 
                  className="accent-brand"
                  onChange={() => updateFilters('brand', brand.name)}
                  checked={currentBrand === brand.name}
                />
                <span className="text-sm text-slate-600 font-medium">{brand.name}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
