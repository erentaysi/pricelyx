import { createClient } from '@supabase/supabase-js';

require('dotenv').config({ path: '.env.local' });

// Admin Client (RLS'i atlar, kurulum için)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function runRlsTest() {
  console.log('\n--- BAŞLIYOR: RLS (Row Level Security) İZOLASYON TESTİ ---\n');
  
  // 1. İki Test Kullanıcısı Oluştur
  const emailA = `vendor_a_${Date.now()}@test.com`;
  const emailB = `vendor_b_${Date.now()}@test.com`;
  const password = 'testpassword123';

  console.log('1. İki farklı test satıcısı oluşturuluyor (Satıcı A ve Satıcı B)...');
  const { data: authA } = await supabaseAdmin.auth.admin.createUser({ email: emailA, password, email_confirm: true });
  const { data: authB } = await supabaseAdmin.auth.admin.createUser({ email: emailB, password, email_confirm: true });

  const userIdA = authA.user!.id;
  const userIdB = authB.user!.id;

  // 2. Vendor Kayıtları
  const { data: vendorA } = await supabaseAdmin.from('vendors').insert({ name: 'Satıcı A', status: 'approved' }).select().single();
  const { data: vendorB } = await supabaseAdmin.from('vendors').insert({ name: 'Satıcı B', status: 'approved' }).select().single();

  await supabaseAdmin.from('vendor_users').insert([
    { vendor_id: vendorA.id, auth_id: userIdA, role: 'admin' },
    { vendor_id: vendorB.id, auth_id: userIdB, role: 'admin' }
  ]);

  // 3. İkisi için de feed_sync_logs tablosuna veri ekle
  console.log('2. Her iki satıcı için de log kayıtları (feed_sync_logs) veritabanına ekleniyor...');
  await supabaseAdmin.from('feed_sync_logs').insert([
    { vendor_id: vendorA.id, status: 'success', error_details: 'SATICI A GİZLİ VERİSİ' },
    { vendor_id: vendorA.id, status: 'success', error_details: 'SATICI A GİZLİ VERİSİ 2' },
    { vendor_id: vendorB.id, status: 'error', error_details: 'SATICI B GİZLİ VERİSİ' }
  ]);

  // 4. SATICI A OLARAK GİRİŞ YAP (RLS DEVREYE GİRER)
  console.log('3. "Satıcı A" hesabıyla normal bir tarayıcı istemcisi gibi giriş yapılıyor...');
  
  // Normal istemci (RLS devrede)
  const supabaseClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  await supabaseClient.auth.signInWithPassword({ email: emailA, password });

  console.log('4. "feed_sync_logs" tablosundan tüm veriler (SELECT *) çekilmeye çalışılıyor...');
  const { data: logs, error } = await supabaseClient.from('feed_sync_logs').select('error_details');

  if (error) {
    console.error('Sorgu hatası:', error);
  } else {
    console.log('\n--- RLS SORGU SONUCU ---');
    console.log(`Veritabanında toplam 3 log var (2 Satıcı A, 1 Satıcı B).`);
    console.log(`Satıcı A'nın görebildiği log sayısı: ${logs.length}`);
    console.log('Görünen veriler:');
    logs.forEach((log, index) => console.log(`   [Kayıt ${index + 1}] ${log.error_details}`));
    
    const hasVendorBData = logs.some((l: any) => l.error_details.includes('SATICI B'));
    if (hasVendorBData) {
      console.error('\n❌ HATA: RLS DELİNDİ! Satıcı A, Satıcı B\'nin verisini görebiliyor!');
    } else {
      console.log('\n✅ BAŞARILI: Satıcı A sadece KENDİ verisini görebiliyor. Satıcı B\'nin verisi RLS tarafından gizlendi!');
    }
  }

  // 5. Temizlik
  console.log('\n5. Test kullanıcıları ve verileri temizleniyor...');
  await supabaseAdmin.from('vendors').delete().in('id', [vendorA.id, vendorB.id]); // Cascade ile her şey silinir
  await supabaseAdmin.auth.admin.deleteUser(userIdA);
  await supabaseAdmin.auth.admin.deleteUser(userIdB);
  console.log('--- TEST BİTTİ ---');
}

runRlsTest().catch(console.error);
