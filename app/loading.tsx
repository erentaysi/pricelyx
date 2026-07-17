import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-slate-200 rounded-full"></div>
        <div className="w-16 h-16 border-4 border-teal-500 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
      </div>
      <h3 className="mt-6 text-slate-500 font-bold tracking-widest uppercase text-sm animate-pulse">
        Yükleniyor...
      </h3>
    </div>
  );
}
