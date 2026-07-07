import React from 'react';
import { Store, Truck, Zap } from 'lucide-react';

interface StoreListViewProps {
  productId: string;
  prices: any[]; // sortedPrices array
}

function trPrice(price: number) {
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(Math.round(price)) + ' ₺';
}

export default function StoreListView({ productId, prices }: StoreListViewProps) {
  return (
    <>
      <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3 uppercase tracking-tight">
        {prices.length > 0 ? (
          <>
            {prices.length} Fiyatı İncele{' '}
            <span className="bg-emerald-50 text-emerald-700 text-[10px] px-3 py-1 rounded-full font-black tracking-widest border border-emerald-100">
              {prices.length} MAĞAZA
            </span>
          </>
        ) : (
          <>
            Fiyat Karşılaştırması{' '}
            <span className="bg-slate-100 text-slate-500 text-[10px] px-3 py-1 rounded-full font-black tracking-widest">
              MAĞAZA YOK
            </span>
          </>
        )}
      </h2>

      <div className="bg-white shadow-2xl shadow-slate-200/50 border border-slate-100 rounded-[2rem] overflow-hidden">
        {prices.map((storeConfig: any, idx: number) => {
          const store = storeConfig.vendors;
          const isCheapest = idx === 0;
          
          // Nötr durumları kontrol et
          const shippingInfo = storeConfig.shipping_info || 'Kargo Bilgisi Yok';
          
          let stockInfo;
          let stockColorClass;
          if (storeConfig.in_stock === true) {
             stockInfo = 'Stokta';
             stockColorClass = 'text-emerald-500';
          } else if (storeConfig.in_stock === false) {
             stockInfo = 'Stokta Yok';
             stockColorClass = 'text-rose-500';
          } else {
             stockInfo = 'Stok Bilgisi Yok';
             stockColorClass = 'text-slate-400';
          }

          return (
            <div
              key={idx}
              className={`p-8 flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-all duration-300 ${
                isCheapest ? 'bg-emerald-50/20' : ''
              }`}
            >
              <div className="flex items-center gap-6">
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl shrink-0 shadow-sm border border-slate-100 bg-white"
                  style={{ color: store?.color || '#cbd5e1' }}
                >
                  {store?.logo || <Store className="w-10 h-10 text-slate-200" />}
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-black text-xl text-slate-900 tracking-tight">
                      {store?.name || 'Bilinmeyen Mağaza'}
                    </h3>
                    {isCheapest && (
                      <span className="bg-emerald-500 text-white text-[9px] px-3 py-1 rounded-full uppercase font-black tracking-widest shadow-lg shadow-emerald-500/20 flex items-center gap-1">
                        <Zap className="w-3 h-3" /> En Uygun
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs font-bold uppercase tracking-widest">
                    <span className="flex items-center gap-2 text-slate-500">
                      <Truck className="w-4 h-4 text-slate-400" /> {shippingInfo}
                    </span>
                    <span className={`${stockColorClass} flex items-center gap-1.5`}>
                      • {stockInfo}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-3 text-right">
                <span className="text-3xl font-black text-slate-900">
                  {trPrice(storeConfig.price)}
                </span>
                {storeConfig.product_url && storeConfig.product_url.startsWith('http') ? (
                  <a
                    href={`/git/${productId}?vendor=${storeConfig.vendor_id || storeConfig.vendors?.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-black bg-slate-900 hover:bg-primary text-white px-8 py-4 rounded-xl transition-all duration-300 shadow-xl shadow-slate-900/10 w-full md:w-auto text-center uppercase tracking-widest"
                  >
                    Mağazaya İlerle
                  </a>
                ) : (
                  <span className="text-xs font-black bg-slate-200 text-slate-400 px-8 py-4 rounded-xl w-full md:w-auto text-center uppercase tracking-widest cursor-not-allowed">
                    Fiyat Takibinde
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {prices.length === 0 && (
          <div className="p-12 text-center text-slate-500 italic font-medium">
            Üzgünüz, henüz bu ürün için doğrulanmış fiyat bilgisi bulunmuyor.
          </div>
        )}
      </div>
    </>
  );
}
