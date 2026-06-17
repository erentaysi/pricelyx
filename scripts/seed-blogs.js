require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const sampleBlogs = [
  {
    title: '2026 Yılında Hangi Telefon Alınır? En İyi 5 Akıllı Telefon',
    slug: '2026-yilinda-hangi-telefon-alinir-en-iyi-5-akilli-telefon',
    excerpt: 'Yeni bir telefon almak istiyor ama yüzlerce model arasında kayboluyorsanız, 2026 yılının en iyi 5 akıllı telefonunu fiyat/performans açısından incelediğimiz bu rehbere göz atın.',
    content: `
## Akıllı Telefon Seçerken Nelere Dikkat Etmeliyiz?

Günümüzde akıllı telefonlar hayatımızın ayrılmaz bir parçası haline geldi. Özellikle 2026 yılında kamera teknolojileri, işlemci güçleri ve batarya ömürleri çok daha ileri seviyeye ulaştı. Peki binlerce lira verip alacağınız cihazın sizin için en doğru seçenek olup olmadığını nasıl anlarsınız?

### 1. Kamera (Megapiksel Her Şey Değildir)
Çoğu kullanıcı sadece megapiksel değerine bakarak karar verir. Ancak lens kalitesi, yapay zeka destekli görüntü işleme yazılımları (örneğin gece modu performansı) çok daha kritiktir.

### 2. İşlemci ve RAM
Telefonda oyun oynamayı seven biriyseniz, en yeni nesil işlemcili bir model seçmeniz elzemdir. Günlük kullanım içinse orta segment bir işlemci yeterli olacaktır.

### 3. Batarya ve Hızlı Şarj
5000 mAh bataryalar artık standart haline geldi, ancak daha da önemlisi telefonun kaç watt hızlı şarjı desteklediğidir.

**Sitemizdeki güncel telefon fiyatlarını karşılaştırarak** bütçenize en uygun modeli bulabilirsiniz!
`,
    image_url: 'https://images.unsplash.com/photo-1598327105666-5b89351cb315?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    published_at: new Date().toISOString()
  },
  {
    title: 'Robot Süpürge Alırken Dikkat Edilmesi Gereken 5 Kriter',
    slug: 'robot-supurge-alirken-dikkat-edilmesi-gereken-5-kriter',
    excerpt: 'Evinizin yeni yardımcısı robot süpürgeler hayat kurtarıyor. Ancak LiDAR sensör, emiş gücü ve mop özelliği gibi teknik detaylarda boğulmamak için rehberimizi okuyun.',
    content: `
## Evinize En Uygun Robot Süpürgeyi Seçme Rehberi

Robot süpürgeler son yılların en popüler teknolojik ev aletlerinden biri oldu. Farklı markalar, farklı özellikler ve oldukça geniş bir fiyat skalası var. Doğru tercihi yapmak için nelere dikkat etmeli?

### 1. Navigasyon Sistemi (LiDAR Şart mı?)
Eğer evinizde çok fazla eşya varsa ve süpürgenin her yere çarparak yönünü bulmasını istemiyorsanız, kesinlikle **LiDAR (Lazer Navigasyon)** kullanan modellere yönelmelisiniz. Bu modeller evin haritasını çıkararak sistemli bir şekilde temizlik yapar.

### 2. Emiş Gücü (Pa Değeri)
Halılarınız kalınsa, 4000 Pa ve üzeri emiş gücüne sahip cihazlar daha iyi performans gösterir. Evcil hayvanınız varsa, emiş gücü yüksek modeller tüyleri toplamada daha etkilidir.

### 3. Mop (Paspas) Özelliği
Çoğu yeni modelde artık mop özelliği var. Ancak mop yaparken halıyı algılayıp paspas bezini kaldıran üst düzey modeller, temizliği çok daha kolaylaştırır.

### 4. İstasyonlu Modeller
Kendi çöpünü boşaltan veya mop bezini yıkayan istasyonlu modeller, tam otomasyon arayanlar için idealdir. Tabii ki bu özellikler fiyata doğrudan etki ediyor.

İhtiyacınıza en uygun modeli belirledikten sonra sitemizden **"Robot Süpürge" fiyatlarını karşılaştırarak** en ucuz mağazayı bulabilirsiniz!
`,
    image_url: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    published_at: new Date().toISOString()
  }
];

async function seedBlogs() {
  console.log('🔄 Blog yazıları veritabanına ekleniyor...');

  try {
    const { data, error } = await supabase
      .from('blogs')
      .upsert(sampleBlogs, { onConflict: 'slug' })
      .select();

    if (error) {
      console.error('❌ Hata oluştu:', error.message);
      return;
    }

    console.log(`✅ İşlem başarılı! ${data.length} adet blog yazısı eklendi.`);
  } catch (err) {
    console.error('❌ Beklenmeyen hata:', err);
  } finally {
    process.exit(0);
  }
}

seedBlogs();
