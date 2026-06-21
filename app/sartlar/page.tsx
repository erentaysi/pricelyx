import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kullanım Koşulları | Piinti',
  description: 'Piinti Kullanım Koşulları ve Şartlar.',
};

export default function Sartlar() {
  return (
    <div className="bg-slate-50 min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 md:p-12">
          
          <div className="text-center mb-12">
            <h1 className="text-4xl font-black text-slate-800 tracking-tight mb-4">Kullanım Koşulları</h1>
            <p className="text-slate-500 font-medium">Son Güncelleme Tarihi: 21 Haziran 2026</p>
          </div>

          <div className="prose prose-slate max-w-none prose-headings:font-bold prose-headings:text-slate-800 prose-p:text-slate-600 prose-li:text-slate-600">
            
            <p className="mb-6 text-lg">
              piinti.com'u ("Site") ziyaret ederek ve kullanarak aşağıdaki Kullanım Koşulları'nı kabul etmiş sayılırsınız.
            </p>

            <h3 className="text-xl mt-8 mb-4">1. Hizmetin Kapsamı ve Yaş Sınırı</h3>
            <p className="mb-6">
              Piinti, internet üzerindeki çeşitli e-ticaret platformlarında yer alan ürünlerin fiyatlarını, özelliklerini ve indirimlerini listeleyen ve karşılaştırma imkanı sunan bağımsız bir platformdur. 
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>Sitemizi kullanabilmek için <strong>18 yaşını doldurmuş</strong> veya yasal temsilcinizin (veli/vasi) iznini almış olmanız gerekmektedir.</li>
            </ul>

            <h3 className="text-xl mt-8 mb-4">2. Fiyat ve Stok Doğruluğu</h3>
            <p className="mb-6">
              Platformumuzda yer alan fiyatlar, stok durumları ve indirim oranları satıcı platformlardan otomatik olarak çekilir. Fiyatlar dinamik olarak değiştiği için, Piinti'de gördüğünüz bir fiyat ile satıcının sitesindeki nihai fiyat arasında anlık gecikmelerden kaynaklanan farklar olabilir. Her zaman, yönlendirildiğiniz satıcının ödeme sayfasındaki nihai fiyat geçerlidir.
            </p>

            <h3 className="text-xl mt-8 mb-4">3. Satış Ortaklığı (Affiliate) Beyanı</h3>
            <p className="mb-6">
              Sitemizde yer alan "Mağazaya Git" gibi butonlar, gelir ortaklığı (affiliate) linkleri içerebilir. Sitemiz üzerinden ilgili mağazaya giderek yaptığınız alışverişlerden Piinti komisyon geliri elde edebilir. Bu komisyon, <strong>sizin ödeyeceğiniz nihai fiyatı kesinlikle artırmaz.</strong>
            </p>

            <h3 className="text-xl mt-8 mb-4">4. Sorumluluk Reddi</h3>
            <p className="mb-6">
              Piinti herhangi bir ürünün doğrudan satıcısı değildir. Satın aldığınız ürünlerin kalitesi, kargolanması, iadesi, garanti süreçleri veya müşteri hizmetleri tamamen ürünü satın aldığınız üçüncü taraf e-ticaret platformunun sorumluluğundadır.
            </p>

            <h3 className="text-xl mt-8 mb-4">5. Uyuşmazlık Çözümü ve Yetkili Mahkeme</h3>
            <p className="mb-6">
              İşbu Kullanım Koşulları'nın uygulanmasından veya yorumlanmasından doğabilecek her türlü uyuşmazlığın çözümünde Türk Hukuku uygulanacak olup, <strong>İstanbul Çağlayan (Avrupa) Mahkemeleri ve İcra Daireleri</strong> münhasıran yetkilidir.
            </p>

          </div>
        </div>
      </div>
    </div>
  );
}
