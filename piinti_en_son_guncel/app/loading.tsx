import { Sparkles } from 'lucide-react';

export default function Loading() {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-md z-[100] flex flex-col items-center justify-center">
      <div className="relative">
        <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-primary animate-pulse" />
        </div>
      </div>
      <h2 className="mt-8 text-xl font-black text-slate-800 tracking-tighter uppercase animate-pulse">
        Piinti Analiz Ediyor...
      </h2>
      <p className="mt-2 text-slate-400 text-xs font-bold tracking-widest uppercase">
        En İyi Fiyatlar Yükleniyor
      </p>
    </div>
  );
}
