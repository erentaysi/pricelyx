import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sıkça Sorulan Sorular | Piinti',
  description: 'Piinti hakkında en çok sorulan sorular ve cevapları.',
};

const faqs = [
  {
    q: "Piinti nedir ve nasıl çalışır?",
    a: "Piinti, binlerce ürünün farklı mağazalardaki fiyatlarını, indirim geçmişlerini ve kupon kodlarını sizin için tek bir çatı altında toplayan akıllı bir alışveriş asistanıdır. Amacımız, en iyi ürünü en ucuza bulmanızı sağlamaktır."
  },
  {
    q: "Piinti'den doğrudan alışveriş yapabilir miyim?",
    a: "Hayır. Piinti bir pazar yeri veya satıcı değildir. Bulduğunuz ürünün yanındaki 'Mağazaya Git' butonuna tıkladığınızda, güvenli alışveriş yapabilmeniz için ilgili satıcının resmi sitesine yönlendirilirsiniz."
  },
  {
    q: "Piinti'yi kullanmak ücretli mi?",
    a: "Kesinlikle hayır. Piinti'nin tüm özellikleri, fiyat karşılaştırmaları ve indirim bildirimleri kullanıcılar için %100 ücretsizdir."
  },
  {
    q: "Fiyatlar ne sıklıkla güncellenir?",
    a: "Fiyatlarımız entegre olduğumuz mağazalardan gelişmiş sistemlerimizle periyodik olarak güncellenir. Ancak e-ticaret siteleri saniyeler içinde fiyat değiştirebildiği için, nihai ve en doğru fiyat her zaman satıcının ödeme sayfasında gördüğünüz fiyattır."
  },
  {
    q: "Hangi mağazaların fiyatlarını gösteriyorsunuz?",
    a: "Şu an ağırlıklı olarak Amazon Türkiye başta olmak üzere, Türkiye'nin en güvenilir ve lider e-ticaret platformlarındaki fiyatları ve kampanyaları listeliyoruz. Mağaza ağımız her geçen gün genişlemektedir."
  },
  {
    q: "Piinti bu hizmetten nasıl para kazanıyor?",
    a: "Platformumuzu ücretsiz tutabilmek için satış ortaklığı (affiliate) modeliyle çalışıyoruz. Piinti üzerinden giderek yaptığınız alışverişlerden küçük bir komisyon alırız. Bu komisyon satıcı tarafından ödenir ve sizin ödeyeceğiniz tutarı kesinlikle etkilemez."
  },
  {
    q: "Aldığım bir ürünü iade etmek istersem ne yapmalıyım?",
    a: "Ürünü Piinti'den değil, yönlendirildiğiniz mağazadan (örn. Amazon) satın aldığınız için iade, değişim ve garanti süreçlerinin tamamı o mağazanın kendi politikalarına tabidir. İlgili mağazanın müşteri hizmetleri ile iletişime geçmelisiniz."
  },
  {
    q: "Kupon kodları ve 'Fiyatı Düşenler' nasıl çalışır?",
    a: "Sistemimiz ürünlerin geçmiş fiyatlarını takip eder. Bir ürünün fiyatı son 30 günün en düşük seviyesine indiğinde 'Fiyatı Düşenler' listemize girer. Varsa ekstra indirim sağlayan güncel kupon kodları da sitemizde size sunulur."
  }
];

export default function SSS() {
  return (
    <div className="bg-slate-50 min-h-screen py-16">
      <div className="max-w-3xl mx-auto px-6">
        
        <div className="text-center mb-16">
          <h1 className="text-4xl font-black text-slate-800 tracking-tight mb-4">Sıkça Sorulan Sorular</h1>
          <p className="text-slate-500 font-medium text-lg">Aklınıza takılan tüm soruların cevapları burada.</p>
        </div>

        <div className="space-y-6">
          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-start gap-3">
                <span className="text-primary font-black text-xl shrink-0">S:</span>
                {faq.q}
              </h3>
              <p className="text-slate-600 leading-relaxed flex items-start gap-3">
                <span className="text-slate-300 font-black text-xl shrink-0">C:</span>
                {faq.a}
              </p>
            </div>
          ))}
        </div>
        
        <div className="mt-16 text-center bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
          <h3 className="font-bold text-xl text-slate-800 mb-2">Başka sorunuz mu var?</h3>
          <p className="text-slate-500 mb-6">Aradığınız cevabı bulamadıysanız bizimle iletişime geçmekten çekinmeyin.</p>
          <a href="/iletisim" className="inline-block bg-primary text-white font-bold py-3 px-8 rounded-full shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
            İletişime Geç
          </a>
        </div>

      </div>
    </div>
  );
}
