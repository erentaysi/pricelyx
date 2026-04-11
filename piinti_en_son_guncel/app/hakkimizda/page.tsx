import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Hakkımızda - Piinti",
  description: "Piinti hakkında bilgi edinin. Türkiye'nin güvenilir fiyat karşılaştırma platformu."
};

export default function Hakkimizda() {
  return (
    <>
      {/* Hero */}
      <section className="gradient-bg text-white py-20">
          <div className="container mx-auto px-4 text-center">
              <h1 className="text-5xl font-bold mb-4">Piinti Hakkında</h1>
              <p className="text-xl text-white/90">En iyi fiyatı bulmak artık çok kolay!</p>
          </div>
      </section>
      
      {/* Content */}
      <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 max-w-4xl">
              
              {/* Misyon */}
              <div className="bg-white rounded-xl shadow-sm p-8 mb-8 border border-slate-100">
                  <h2 className="text-3xl font-bold text-gray-800 mb-4">Misyonumuz</h2>
                  <p className="text-gray-600 text-lg leading-relaxed mb-4">
                      Piinti olarak, Türkiye'deki online alışveriş yapan milyonlarca kişiye en iyi fiyatı bulma imkanı sunuyoruz. 
                      Tüm e-ticaret sitelerini tarayıp, aynı ürünün en uygun fiyatını tek bir platformda karşılaştırmanızı sağlıyoruz.
                  </p>
                  <p className="text-gray-600 text-lg leading-relaxed">
                      Amacımız basit: Zamanınızı ve paranızı tasarruf etmenize yardımcı olmak. Artık onlarca siteyi tek tek dolaşmanıza gerek yok!
                  </p>
              </div>
              
              {/* Neden PriceLyx? -> Piinti */}
              <div className="bg-white rounded-xl shadow-sm p-8 mb-8 border border-slate-100">
                  <h2 className="text-3xl font-bold text-gray-800 mb-6">Neden Piinti?</h2>
                  <div className="space-y-6">
                      <div className="flex gap-4">
                          <div className="text-4xl text-primary font-bold bg-primary/10 w-16 h-16 flex items-center justify-center rounded-xl">₺</div>
                          <div>
                              <h3 className="text-xl font-semibold mb-2">Tasarruf Edin</h3>
                              <p className="text-gray-600">Aynı ürün için ortalama %15-40 arasında tasarruf edin. En düşük fiyatı garantiliyoruz!</p>
                          </div>
                      </div>
                      
                      <div className="flex gap-4">
                          <div className="text-4xl text-primary font-bold bg-primary/10 w-16 h-16 flex items-center justify-center rounded-xl">⚡</div>
                          <div>
                              <h3 className="text-xl font-semibold mb-2">Zaman Kazanın</h3>
                              <p className="text-gray-600">Onlarca siteyi tek tek aramak yerine, bir arama ile tüm fiyatları görün.</p>
                          </div>
                      </div>
                      
                      <div className="flex gap-4">
                          <div className="text-4xl text-primary font-bold bg-primary/10 w-16 h-16 flex items-center justify-center rounded-xl">✓</div>
                          <div>
                              <h3 className="text-xl font-semibold mb-2">Güvenilir Bilgi</h3>
                              <p className="text-gray-600">Gerçek zamanlı fiyat güncellemeleri ile her zaman doğru bilgiye ulaşın.</p>
                          </div>
                      </div>
                      
                      <div className="flex gap-4">
                          <div className="text-4xl text-primary font-bold bg-primary/10 w-16 h-16 flex items-center justify-center rounded-xl">🎯</div>
                          <div>
                              <h3 className="text-xl font-semibold mb-2">Kolay Kullanım</h3>
                              <p className="text-gray-600">Sade, temiz ve kullanıcı dostu arayüz. İstediğiniz ürünü saniyeler içinde bulun.</p>
                          </div>
                      </div>
                  </div>
              </div>
              
              {/* İstatistikler */}
              <div className="bg-gradient-to-r from-primary to-accent rounded-xl shadow-lg p-8 mb-8 text-white relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-full bg-white opacity-5 mix-blend-overlay"></div>
                  <h2 className="text-3xl font-bold mb-8 text-center relative z-10">Rakamlarla Piinti</h2>
                  <div className="grid md:grid-cols-3 gap-8 text-center relative z-10">
                      <div>
                          <div className="text-5xl font-bold mb-2">500K+</div>
                          <div className="text-white/90">Ürün</div>
                      </div>
                      <div>
                          <div className="text-5xl font-bold mb-2">50+</div>
                          <div className="text-white/90">Mağaza</div>
                      </div>
                      <div>
                          <div className="text-5xl font-bold mb-2">%40</div>
                          <div className="text-white/90">Ortalama Tasarruf</div>
                      </div>
                  </div>
              </div>
              
              {/* İletişim */}
              <div className="bg-white rounded-xl shadow-sm p-8 border border-slate-100">
                  <h2 className="text-3xl font-bold text-gray-800 mb-4">Bize Ulaşın</h2>
                  <p className="text-gray-600 text-lg mb-6">
                      Sorularınız, önerileriniz veya geri bildirimleriniz için bizimle iletişime geçebilirsiniz.
                  </p>
                  <div className="space-y-4">
                      <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-xl">📧</div>
                          <a href="mailto:info@piinti.com" className="text-primary hover:underline text-lg font-medium">info@piinti.com</a>
                      </div>
                      <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-xl">📱</div>
                          <span className="text-gray-700 text-lg font-medium">+90 850 000 00 00</span>
                      </div>
                      <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-xl">📍</div>
                          <span className="text-gray-700 text-lg font-medium">İstanbul, Türkiye</span>
                      </div>
                  </div>
              </div>
              
          </div>
      </section>
    </>
  );
}
