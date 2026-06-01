import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { logout } from '../giris/actions';
import { User, LogOut, Heart, BellRing, Settings, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
  title: 'Profilim - Piinti v2',
};

export default async function ProfilePage() {
  const supabase = createClient();

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/giris');
  }

  let favCount = 0;
  let alertCount = 0;
  let favorites: any[] = [];
  let priceAlerts: any[] = [];
  
  try {
     // ===== FAVORİLER =====
     const { data: favRows, count: fC, error: favError } = await supabase
        .from('user_favorites')
        .select('id, product_id, created_at', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
     
     if (favError) console.error('Fav query error:', favError.message);
     if (fC) favCount = fC;
     
     if (favRows && favRows.length > 0) {
        const productIds = favRows.map(f => f.product_id);
        
        const { data: favProducts, error: prodError } = await supabase
           .from('products')
           .select('id, title, slug, image_url')
           .in('id', productIds);
        
        if (prodError) console.error('Fav products query error:', prodError.message);
        
        const { data: favPrices } = await supabase
           .from('product_prices')
           .select('product_id, price')
           .in('product_id', productIds);
        
        favorites = favRows.map(fav => {
           const product = favProducts?.find(p => p.id === fav.product_id) || null;
           const prices = favPrices?.filter(pp => pp.product_id === fav.product_id).map(pp => pp.price) || [];
           return { ...fav, product, prices };
        });
     }
     
     // ===== FİYAT ALARMLARI =====
     const { data: alertRows, count: aC, error: alertError } = await supabase
        .from('price_alerts')
        .select('id, product_id, target_price, email, created_at', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
     
     if (alertError) console.error('Alert query error:', alertError.message);
     if (aC) alertCount = aC;
     
     if (alertRows && alertRows.length > 0) {
        const alertProductIds = alertRows.map(a => a.product_id).filter(Boolean);
        
        let alertProducts: any[] = [];
        if (alertProductIds.length > 0) {
           const { data: ap, error: apError } = await supabase
              .from('products')
              .select('id, title, slug, image_url')
              .in('id', alertProductIds);
           if (apError) console.error('Alert products query error:', apError.message);
           if (ap) alertProducts = ap;
        }
        
        priceAlerts = alertRows.map(alert => {
           const product = alertProducts.find(p => p.id === alert.product_id) || null;
           return { ...alert, product };
        });
     }
  } catch(e: any) {
      console.error('Profile data error:', e?.message || e);
  }

  return (
    <div className="pt-24 pb-16 min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 max-w-5xl">
        
        {/* Profil Kartı */}
        <div className="mb-8 p-8 bg-white border border-slate-100 rounded-3xl shadow-sm flex flex-col md:flex-row items-center md:items-start gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-400/5 rounded-full blur-[80px] pointer-events-none"></div>
          
          <div className="w-24 h-24 bg-gradient-to-tr from-slate-100 to-slate-200 rounded-full flex items-center justify-center p-1 shadow-inner relative z-10">
             <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                 <User className="w-10 h-10 text-slate-300" />
             </div>
          </div>
          
          <div className="flex-1 text-center md:text-left relative z-10">
             <h1 className="text-2xl font-black tracking-tight text-slate-800">
                {user.user_metadata?.full_name || 'Piinti Üyesi'}
             </h1>
             <p className="text-slate-500 font-medium mb-4">{user.email}</p>
             
             <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                 <div className="bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl flex items-center gap-2">
                     <Heart className="w-4 h-4 text-rose-500" />
                     <span className="text-sm font-bold text-slate-700">{favCount} Favori</span>
                 </div>
                 <div className="bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl flex items-center gap-2">
                     <BellRing className="w-4 h-4 text-amber-500" />
                     <span className="text-sm font-bold text-slate-700">{alertCount} Aktif Alarm</span>
                 </div>
             </div>
          </div>
          
          <form className="relative z-10 w-full md:w-auto mt-4 md:mt-0 flex flex-col gap-2">
             <button className="w-full md:w-auto px-6 py-3 bg-white border border-slate-200 hover:border-teal-500 hover:text-teal-600 text-slate-600 font-bold rounded-xl flex items-center justify-center gap-2 transition-all">
                 <Settings className="w-4 h-4" /> Ayarlar
             </button>
             <button formAction={logout} className="w-full md:w-auto px-6 py-3 bg-rose-50 border border-rose-100 text-rose-600 hover:bg-rose-100 hover:border-rose-200 font-bold rounded-xl flex items-center justify-center gap-2 transition-all">
                 <LogOut className="w-4 h-4" /> Çıkış Yap
             </button>
          </form>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Favoriler */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-black flex items-center gap-2 text-slate-800">
                       <Heart className="w-5 h-5 text-rose-500 fill-rose-500" /> Favorilerim
                    </h2>
                    <Link href="/urunler" className="text-sm font-bold text-teal-600 hover:underline">Ürünleri Keşfet</Link>
                </div>
                
                {favCount === 0 ? (
                    <div className="text-center py-12 px-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-slate-400">
                        <Heart className="w-10 h-10 opacity-20 mx-auto mb-3" />
                        <p className="text-sm font-bold">Henüz kalbini çalan bir ürün yok.</p>
                        <p className="text-xs mt-1">Hemen fırsatları aramaya başla!</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {favorites.map((fav) => {
                            const p = fav.product;
                            const minPrice = fav.prices && fav.prices.length > 0 ? Math.min(...fav.prices) : null;
                            
                            return (
                                <Link 
                                  href={p?.slug ? `/urunler/${p.slug}` : '/urunler'} 
                                  key={fav.id} 
                                  className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors group"
                                >
                                    <div className="w-16 h-16 bg-white rounded-xl border border-slate-100 overflow-hidden flex-shrink-0 relative">
                                        {p?.image_url ? (
                                            <Image src={p.image_url} alt={p?.title || 'Ürün'} fill className="object-contain p-1" sizes="64px" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Heart className="w-6 h-6 text-rose-300" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-sm font-bold text-slate-800 truncate group-hover:text-teal-600 transition-colors">
                                            {p?.title || 'Favori Ürün'}
                                        </h3>
                                        <p className="text-xs text-slate-500 font-medium mt-1">
                                            {minPrice ? `${minPrice.toLocaleString('tr-TR')} ₺'den başlayan fiyatlar` : 'Fiyat bilgisi yükleniyor...'}
                                        </p>
                                    </div>
                                    <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-teal-500 transition-colors flex-shrink-0" />
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Fiyat Alarmları */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-black flex items-center gap-2 text-slate-800">
                       <BellRing className="w-5 h-5 text-amber-500" /> Fiyat Kapanları
                    </h2>
                    <span className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-lg">{alertCount} Alarm</span>
                </div>
                
                {alertCount === 0 ? (
                    <div className="text-center py-12 px-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-slate-400">
                        <BellRing className="w-10 h-10 opacity-20 mx-auto mb-3" />
                        <p className="text-sm font-bold">Gözcümüz uyuyor.</p>
                        <p className="text-xs mt-1">Ürünlerdeki zil ikonuna tıklayarak alarm kurabilirsin.</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {priceAlerts.map((alert) => {
                            const p = alert.product;
                            
                            return (
                                <Link 
                                  href={p?.slug ? `/urunler/${p.slug}` : '/urunler'} 
                                  key={alert.id} 
                                  className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors group"
                                >
                                    <div className="w-16 h-16 bg-white rounded-xl border border-slate-100 overflow-hidden flex-shrink-0 relative">
                                        {p?.image_url ? (
                                            <Image src={p.image_url} alt={p?.title || 'Ürün'} fill className="object-contain p-1" sizes="64px" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <BellRing className="w-6 h-6 text-amber-300" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-sm font-bold text-slate-800 truncate group-hover:text-teal-600 transition-colors">
                                            {p?.title || 'Alarm Kurulu Ürün'}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                                                Hedef: {alert.target_price?.toLocaleString('tr-TR') || '—'} ₺
                                            </span>
                                        </div>
                                    </div>
                                    <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-teal-500 transition-colors flex-shrink-0" />
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
        
      </div>
    </div>
  );
}
