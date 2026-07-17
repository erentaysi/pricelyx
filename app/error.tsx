'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/monitoring/logger';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Hatayı merkezi logger'a gönder
    logger.error('Global Application Error', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white max-w-md w-full rounded-3xl p-8 text-center border border-slate-100 shadow-xl">
        <div className="w-20 h-20 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle size={32} />
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-3">Beklenmedik Bir Hata Oluştu</h2>
        <p className="text-slate-500 mb-8">
          Sistemsel bir hata meydana geldi. Ekibimiz bu durumu anında raporladı ve ilgileniyor.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors"
          >
            Tekrar Dene
          </button>
          <Link
            href="/"
            className="px-6 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
          >
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    </div>
  );
}
