import type { Metadata } from "next";
import "./globals.css";
import Link from 'next/link';

export const metadata: Metadata = {
  metadataBase: new URL('https://pricelyx-ten.vercel.app'),
  title: {
    default: "Piinti | Akıllı Alışverişin Ayrıcalıklı Adresi",
    template: "%s | Piinti"
  },
  description: "Türkiye'nin en seçkin pazar yerlerini saniyeler içinde analiz edin. Piinti ile milyonlarca ürün arasından kaliteden ödün vermeden en doğru fiyatı keşfedin.",
  openGraph: {
    title: "Piinti | Akıllı Alışverişin Ayrıcalıklı Adresi",
    description: "Sınıfının en iyisi fiyat karşılaştırma platformuyla premium alışveriş deneyimini yaşayın.",
    url: "https://pricelyx-ten.vercel.app",
    siteName: "Piinti",
    locale: "tr_TR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Piinti | Akıllı Alışverişin Ayrıcalıklı Adresi",
    description: "Kaliteden ödün vermeden en iyi fiyata ulaşın.",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className="bg-gray-50 font-sans antialiased">
        <Navbar />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}

function Navbar() {
  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center">
                    <svg width="160" height="40" viewBox="0 0 200 50" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" style={{stopColor: "#2E86AB", stopOpacity: 1}} />
                                <stop offset="100%" style={{stopColor: "#A23B72", stopOpacity: 1}} />
                            </linearGradient>
                        </defs>
                        <path d="M 10 35 L 10 15 C 10 10 15 5 20 5 L 30 5 C 35 5 40 10 40 15 C 40 20 35 25 30 25 L 20 25 M 10 25 L 35 45" 
                              stroke="url(#logoGradient)" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                        <text x="45" y="32" fontFamily="'Inter', sans-serif" fontSize="26" fontWeight="700" fill="url(#logoGradient)">Piinti</text>
                        <text x="48" y="42" fontFamily="'Inter', sans-serif" fontSize="8" fill="#666">Akıllı Alışveriş</text>
                    </svg>
                </Link>
                
                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center space-x-6">
                    <Link href="/" className="text-gray-700 hover:text-primary transition">Ana Sayfa</Link>
                    <Link href="/urunler" className="text-gray-700 hover:text-primary transition">Tüm Ürünler</Link>
                    <Link href="/kampanyalar" className="text-gray-700 hover:text-primary transition">Kampanyalar</Link>
                    <Link href="/hakkimizda" className="text-gray-700 hover:text-primary transition">Hakkımızda</Link>
                </div>
            </div>
        </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="bg-dark text-white py-12">
        <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
                <div>
                    <svg width="140" height="35" viewBox="0 0 200 50" xmlns="http://www.w3.org/2000/svg" className="mb-4">
                        <defs>
                            <linearGradient id="footerLogoGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" style={{stopColor: "#2E86AB", stopOpacity: 1}} />
                                <stop offset="100%" style={{stopColor: "#A23B72", stopOpacity: 1}} />
                            </linearGradient>
                        </defs>
                        <path d="M 10 35 L 10 15 C 10 10 15 5 20 5 L 30 5 C 35 5 40 10 40 15 C 40 20 35 25 30 25 L 20 25 M 10 25 L 35 45" 
                              stroke="url(#footerLogoGradient)" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                        <text x="45" y="32" fontFamily="'Inter', sans-serif" fontSize="26" fontWeight="700" fill="url(#footerLogoGradient)">Piinti</text>
                    </svg>
                    <p className="text-gray-400">En iyi fiyatları bul, akıllı alışveriş yap.</p>
                </div>
                
                <div>
                    <h4 className="font-semibold mb-4">Hızlı Linkler</h4>
                    <ul className="space-y-2 text-gray-400">
                        <li><Link href="/hakkimizda" className="hover:text-white transition">Hakkımızda</Link></li>
                        <li><Link href="#" className="hover:text-white transition">İletişim</Link></li>
                        <li><Link href="#" className="hover:text-white transition">Kariyer</Link></li>
                    </ul>
                </div>
                
                <div>
                    <h4 className="font-semibold mb-4">Yardım</h4>
                    <ul className="space-y-2 text-gray-400">
                        <li><Link href="#" className="hover:text-white transition">SSS</Link></li>
                        <li><Link href="#" className="hover:text-white transition">Kullanım Koşulları</Link></li>
                        <li><Link href="#" className="hover:text-white transition">Gizlilik Politikası</Link></li>
                    </ul>
                </div>
                
                <div>
                    <h4 className="font-semibold mb-4">Bizi Takip Edin</h4>
                    <div className="flex gap-4">
                        <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-primary transition">f</a>
                        <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-primary transition">t</a>
                        <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-primary transition">in</a>
                    </div>
                </div>
            </div>
            
            <div className="border-t border-gray-700 pt-8 text-center text-gray-400">
                <p>&copy; 2026 Piinti - Tüm hakları saklıdır.</p>
            </div>
        </div>
   </footer>
  )
}
