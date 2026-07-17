import Link from 'next/link';
import { Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white max-w-lg w-full rounded-3xl p-10 text-center border border-slate-100 shadow-xl">
        <div className="text-8xl font-black text-slate-100 mb-6 tracking-tighter">404</div>
        <h2 className="text-3xl font-black text-slate-800 mb-4">Sayfa Bulunamadı</h2>
        <p className="text-slate-500 mb-8 text-lg">
          Aradığınız ürün, kategori veya marka sayfasına ulaşılamıyor. Yayından kaldırılmış veya URL değişmiş olabilir.
        </p>
        
        <div className="flex flex-col gap-4">
          <Link
            href="/"
            className="w-full px-6 py-4 bg-teal-500 text-white font-black rounded-xl hover:bg-teal-600 transition-colors shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2"
          >
            <Search size={20} />
            Ürün Aramaya Dön
          </Link>
          <Link
            href="/kampanyalar"
            className="w-full px-6 py-4 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
          >
            Güncel Kampanyalara Göz At
          </Link>
        </div>
      </div>
    </div>
  );
}
