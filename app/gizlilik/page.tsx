import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gizlilik ve Çerez Politikası | Piinti',
  description: 'Piinti Gizlilik ve Çerez Politikası metni.',
};

export default function Gizlilik() {
  return (
    <div className="bg-slate-50 min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 md:p-12">
          
          <div className="text-center mb-12">
            <h1 className="text-4xl font-black text-slate-800 tracking-tight mb-4">Gizlilik ve Çerez Politikası</h1>
            <p className="text-slate-500 font-medium">Son Güncelleme Tarihi: 21 Haziran 2026</p>
          </div>

          <div className="prose prose-slate max-w-none prose-headings:font-bold prose-headings:text-slate-800 prose-p:text-slate-600 prose-li:text-slate-600">
            
            <h3 className="text-xl mt-8 mb-4">1. Veri Sorumlusunun Kimliği</h3>
            <p className="mb-6">
              6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca, web sitemizi (piinti.com) ziyaret ettiğinizde işlenen kişisel verileriniz bakımından veri sorumlusu <strong>Piinti Platformu</strong>'dur.
              <br />
              <strong>İletişim:</strong> info@piinti.com
            </p>

            <h3 className="text-xl mt-8 mb-4">2. Hangi Verileri Topluyoruz ve Hangi Amaçla Kullanıyoruz?</h3>
            <p className="mb-6">
              Piinti, genel kullanımı sırasında kullanıcılardan doğrudan isim, T.C. kimlik numarası veya kredi kartı gibi hassas kişisel veriler talep etmez. Ancak siteyi kullanımınızı iyileştirmek amacıyla tarayıcı ve cihaz bilgileriniz, IP adresiniz, sitede geçirdiğiniz süre ve tıklama verileriniz anonim olarak toplanabilir. Bu veriler:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>Web sitemizin performansını ölçmek ve kullanıcı deneyimini (UX) geliştirmek,</li>
              <li>Platform üzerindeki hataları tespit etmek ve gidermek,</li>
              <li>Hangi ürün/kategorilerin daha çok ilgi gördüğünü analiz etmek amacıyla işlenmektedir.</li>
            </ul>

            <h3 className="text-xl mt-8 mb-4">3. Çerez (Cookie) Kullanımı ve Kategorileri</h3>
            <p className="mb-6">
              Sitemizde size daha iyi hizmet verebilmek için çerezler kullanılmaktadır. Çerezler 3 ana kategoriye ayrılmaktadır:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li><strong>Zorunlu Çerezler:</strong> Sitenin temel işlevlerini (örn. oturum yönetimi, güvenlik) yerine getirebilmesi için kesinlikle gerekli olan çerezlerdir. Onayınıza tabi değildir.</li>
              <li><strong>Analitik Çerezler:</strong> Ziyaretçilerin siteyi nasıl kullandığını anlamamızı sağlayan, üçüncü taraf araçlar (örn. Google Analytics) aracılığıyla toplanan anonim istatistiksel çerezlerdir.</li>
              <li><strong>Reklam ve Pazarlama Çerezleri:</strong> Kullanıcıların ilgi alanlarına göre özelleştirilmiş içerik ve reklam sunmak amacıyla kullanılan çerezlerdir (Google Ads vb.).</li>
            </ul>
            <p className="mb-6">
              Çerez tercihlerinizi dilediğiniz zaman tarayıcı ayarlarınızdan değiştirebilir veya silebilirsiniz. Zorunlu çerezlerin kapatılması sitenin çalışmasını aksatabilir.
            </p>

            <h3 className="text-xl mt-8 mb-4">4. İlgili Kişi Hakları (KVKK Madde 11)</h3>
            <p className="mb-6">
              KVKK'nın 11. maddesi uyarınca, veri sorumlusuna başvurarak kendinizle ilgili;
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme,</li>
              <li>İşlenmişse buna ilişkin bilgi talep etme,</li>
              <li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme,</li>
              <li>Yurt içinde veya yurt dışında aktarıldığı 3. kişileri bilme,</li>
              <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme,</li>
              <li>KVKK 7. maddede öngörülen şartlar çerçevesinde silinmesini/yok edilmesini isteme haklarına sahipsiniz.</li>
            </ul>
            <p className="mb-6">
              Bu haklarınızı kullanmak için <strong>info@piinti.com</strong> adresi üzerinden bizimle iletişime geçebilirsiniz. Talepleriniz en geç 30 gün içinde ücretsiz olarak sonuçlandırılacaktır.
            </p>

            <h3 className="text-xl mt-8 mb-4">5. Satış Ortaklığı (Affiliate) Programları ve Üçüncü Taraf Bağlantıları</h3>
            <p className="mb-6">
              Piinti, <strong>Amazon Associates</strong> ve diğer satış ortaklığı (affiliate) programlarının bir katılımcısıdır. Sitemizdeki ürün yönlendirme bağlantılarına tıkladığınızda, ilgili üçüncü taraf siteye yönlendirilirsiniz. Yönlendirildiğiniz sitelerin kendi gizlilik ve çerez politikaları geçerlidir. Satın alma işlemleriniz, ödeme bilgileriniz veya kargo adresiniz Piinti tarafından <strong>asla görülmez, kaydedilmez ve işlenmez</strong>.
            </p>

          </div>
        </div>
      </div>
    </div>
  );
}
