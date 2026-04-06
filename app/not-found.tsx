import Link from 'next/link';
import { Search, Home, ArrowLeft } from 'lucide-react';
import SearchForm from './components/SearchForm';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6 py-24 bg-gray-50">
      <div className="max-w-2xl w-full text-center">
        <div className="mb-12 relative inline-block">
          <div className="text-[150px] font-black text-slate-900/5 leading-none select-none">404</div>
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="bg-white p-6 rounded-[2rem] shadow-2xl border border-slate-100 rotate-3 group hover:rotate-0 transition-transform duration-500">
                <Search className="w-16 h-16 text-primary animate-pulse" />
             </div>
          </div>
        </div>
        
        <h1 className="text-4xl font-black text-slate-900 mb-6 tracking-tight">Kanka Bu Sayfayı Bulamadık! 🕵️‍♂️</h1>
        <p className="text-slate-500 font-medium mb-12 text-lg leading-relaxed max-w-md mx-auto">
          Aradığın ürün veya sayfa şu an Piinti radarında değil ya da taşınmış olabilir. Gel beraber yenisini arayalım.
        </p>

        <div className="max-w-md mx-auto mb-12">
            <SearchForm />
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link 
            href="/" 
            className="flex items-center gap-3 bg-slate-900 hover:bg-primary text-white font-black px-8 py-4 rounded-2xl transition-all duration-300 shadow-xl shadow-slate-900/10 uppercase tracking-widest text-xs"
          >
            <Home className="w-4 h-4" /> Ana Sayfaya Dön
          </Link>
          <button 
            onClick={() => window.history.back()}
            className="flex items-center gap-3 bg-white hover:bg-slate-50 text-slate-600 font-bold px-8 py-4 rounded-2xl border border-slate-200 transition-all duration-300"
          >
            <ArrowLeft className="w-4 h-4" /> Geri Git
          </button>
        </div>
      </div>
    </div>
  );
}
