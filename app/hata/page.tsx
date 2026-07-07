'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft, Home } from 'lucide-react';
import { Suspense } from 'react';

const ERROR_MESSAGES: Record<string, { title: string; desc: string }> = {
  'eksik-parametre': {
    title: 'Geçersiz Bağlantı',
    desc: 'Bu mağaza bağlantısı eksik parametreler içeriyor. Lütfen ürün sayfasına dönüp tekrar deneyin.',
  },
  'gecersiz-vendor': {
    title: 'Mağaza Tanımlanamadı',
    desc: 'Mağaza bilgisi doğrulanamadı. Ürün sayfasına dönerek farklı bir mağazayı deneyebilirsiniz.',
  },
  'magaza-bulunamadi': {
    title: 'Mağaza Fiyatı Bulunamadı',
    desc: 'Bu mağaza için kayıtlı fiyat bilgisi şu an veritabanımızda bulunmuyor. Fiyat listesi güncelleniyor olabilir.',
  },
  'gecersiz-url': {
    title: 'Geçersiz Mağaza Bağlantısı',
    desc: 'Bu ürün için kayıtlı mağaza bağlantısı geçerli bir URL değil. Lütfen başka bir mağazayı deneyin.',
  },
};

function HataIcerik() {
  const searchParams = useSearchParams();
  const kod = searchParams.get('kod') || 'genel';
  const urunId = searchParams.get('urun');

  const hata = ERROR_MESSAGES[kod] || {
    title: 'Mağazaya Yönlendirme Başarısız',
    desc: 'Mağazaya yönlendirilirken bir sorun oluştu. Lütfen ürün sayfasına dönüp tekrar deneyin.',
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-2xl shadow-slate-200/50 p-10 text-center">
          {/* İkon */}
          <div className="w-20 h-20 bg-amber-50 border border-amber-100 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-amber-500" />
          </div>

          {/* Başlık */}
          <h1 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">
            {hata.title}
          </h1>

          {/* Açıklama */}
          <p className="text-slate-500 font-medium leading-relaxed mb-8">
            {hata.desc}
          </p>

          {/* Hata kodu (geliştirici/destek için) */}
          <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 mb-8 inline-block">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
              Hata Kodu: {kod}
            </span>
          </div>

          {/* CTA Butonları */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {urunId ? (
              <Link
                href={`/urun/${urunId}`}
                className="flex items-center justify-center gap-2 bg-slate-900 text-white font-black px-6 py-3.5 rounded-xl text-sm uppercase tracking-widest hover:-translate-y-0.5 transition-all shadow-lg shadow-slate-900/20"
              >
                <ArrowLeft className="w-4 h-4" />
                Ürün Sayfasına Dön
              </Link>
            ) : null}
            <Link
              href="/"
              className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 font-black px-6 py-3.5 rounded-xl text-sm uppercase tracking-widest hover:border-primary hover:text-primary transition-all"
            >
              <Home className="w-4 h-4" />
              Ana Sayfaya Git
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 font-bold mt-6 uppercase tracking-widest">
          Sorun devam ederse{' '}
          <Link href="/iletisim" className="text-primary hover:underline">
            bize ulaşın
          </Link>
          .
        </p>
      </div>
    </main>
  );
}

export default function HataSayfasi() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-slate-400 font-bold uppercase tracking-widest text-sm">Yükleniyor...</div>
      </main>
    }>
      <HataIcerik />
    </Suspense>
  );
}
