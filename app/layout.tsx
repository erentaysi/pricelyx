import type { Metadata } from "next";
import "./globals.css";
import Link from 'next/link';
import AICoach from "./components/AICoach";
import { 
  Info, 
  Phone, 
  Briefcase, 
  HelpCircle, 
  FileText, 
  ShieldCheck, 
  Mail,
  MapPin,
  Instagram,
  Twitter,
  Linkedin,
  Facebook
} from 'lucide-react';

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
      <body className="bg-gray-50 font-sans antialiased text-slate-900">
        <Navbar />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
        <AICoach />
      </body>
    </html>
  );
}

function Navbar() {
  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center group">
                    <svg width="160" height="40" viewBox="0 0 200 50" xmlns="http://www.w3.org/2000/svg" className="group-hover:scale-105 transition-transform duration-300">
                        <defs>
                            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" style={{stopColor: "#2E86AB", stopOpacity: 1}} />
                                <stop offset="100%" style={{stopColor: "#A23B72", stopOpacity: 1}} />
                            </linearGradient>
                        </defs>
                        <path d="M 10 35 L 10 15 C 10 10 15 5 20 5 L 30 5 C 35 5 40 10 40 15 C 40 20 35 25 30 25 L 20 25 M 10 25 L 35 45" 
                              stroke="url(#logoGradient)" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                        <text x="45" y="32" fontFamily="'Inter', sans-serif" fontSize="26" fontWeight="900" fill="url(#logoGradient)">Piinti</text>
                        <text x="48" y="42" fontFamily="'Inter', sans-serif" fontSize="8" fontWeight="600" fill="#94a3b8" letterSpacing="1">PREMIUM ANALYTICS</text>
                    </svg>
                </Link>
                
                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center space-x-8">
                    <Link href="/" className="text-sm font-bold text-slate-500 hover:text-primary transition-colors">Ana Sayfa</Link>
                    <Link href="/urunler" className="text-sm font-bold text-slate-500 hover:text-primary transition-colors">Tüm Ürünler</Link>
                    <Link href="/kampanyalar" className="text-sm font-bold text-slate-500 hover:text-primary transition-colors">Kampanyalar</Link>
                    <Link href="/hakkimizda" className="text-sm font-bold text-slate-500 hover:text-primary transition-colors">Hakkımızda</Link>
                </div>
            </div>
        </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="bg-slate-900 text-white pt-20 pb-10">
        <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-12 mb-16">
                <div className="col-span-1 md:col-span-1">
                    <Link href="/" className="inline-block mb-6">
                      <svg width="140" height="35" viewBox="0 0 200 50" xmlns="http://www.w3.org/2000/svg">
                          <defs>
                              <linearGradient id="footerLogoGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                  <stop offset="0%" style={{stopColor: "#2E86AB", stopOpacity: 1}} />
                                  <stop offset="100%" style={{stopColor: "#A23B72", stopOpacity: 1}} />
                              </linearGradient>
                          </defs>
                          <path d="M 10 35 L 10 15 C 10 10 15 5 20 5 L 30 5 C 35 5 40 10 40 15 C 40 20 35 25 30 25 L 20 25 M 10 25 L 35 45" 
                                stroke="url(#footerLogoGradient)" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                          <text x="45" y="32" fontFamily="'Inter', sans-serif" fontSize="26" fontWeight="900" fill="url(#footerLogoGradient)">Piinti</text>
                      </svg>
                    </Link>
                    <p className="text-slate-400 text-sm leading-relaxed mb-8">
                      Milyonlarca ürünü anlık olarak analiz eden Piinti, alışveriş yolculuğunuzda size en doğru şeffaflığı sunar.
                    </p>
                    <div className="flex gap-4">
                        <a href="#" className="w-10 h-10 rounded-full border border-slate-700 flex items-center justify-center hover:bg-white hover:text-slate-900 transition-all duration-300"><Twitter className="w-4 h-4" /></a>
                        <a href="#" className="w-10 h-10 rounded-full border border-slate-700 flex items-center justify-center hover:bg-white hover:text-slate-900 transition-all duration-300"><Instagram className="w-4 h-4" /></a>
                        <a href="#" className="w-10 h-10 rounded-full border border-slate-700 flex items-center justify-center hover:bg-white hover:text-slate-900 transition-all duration-300"><Linkedin className="w-4 h-4" /></a>
                    </div>
                </div>
                
                <div>
                    <h4 className="font-bold mb-6 text-white text-lg tracking-tight">Hızlı Linkler</h4>
                    <ul className="space-y-4">
                        <li><Link href="/hakkimizda" className="text-slate-400 hover:text-white transition-colors flex items-center gap-3 text-sm underline-offset-4 hover:underline"><Info className="w-4 h-4" /> Hakkımızda</Link></li>
                        <li><Link href="/iletisim" className="text-slate-400 hover:text-white transition-colors flex items-center gap-3 text-sm underline-offset-4 hover:underline"><Mail className="w-4 h-4" /> İletişim</Link></li>
                        <li><Link href="/kariyer" className="text-slate-400 hover:text-white transition-colors flex items-center gap-3 text-sm underline-offset-4 hover:underline"><Briefcase className="w-4 h-4" /> Kariyer</Link></li>
                    </ul>
                </div>
                
                <div>
                    <h4 className="font-bold mb-6 text-white text-lg tracking-tight">Yardım & Destek</h4>
                    <ul className="space-y-4">
                        <li><Link href="/sss" className="text-slate-400 hover:text-white transition-colors flex items-center gap-3 text-sm underline-offset-4 hover:underline"><HelpCircle className="w-4 h-4" /> SSS</Link></li>
                        <li><Link href="/sartlar" className="text-slate-400 hover:text-white transition-colors flex items-center gap-3 text-sm underline-offset-4 hover:underline"><FileText className="w-4 h-4" /> Kullanım Koşulları</Link></li>
                        <li><Link href="/gizlilik" className="text-slate-400 hover:text-white transition-colors flex items-center gap-3 text-sm underline-offset-4 hover:underline"><ShieldCheck className="w-4 h-4" /> Gizlilik Politikası</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-bold mb-6 text-white text-lg tracking-tight">Merkez Ofis</h4>
                    <ul className="space-y-4">
                        <li className="text-slate-400 flex items-start gap-3 text-sm">
                          <MapPin className="w-5 h-5 shrink-0 text-primary" />
                          <span>Levent, Büyükdere Cd. No:199, 34394 Şişli/İstanbul</span>
                        </li>
                        <li className="text-slate-400 flex items-center gap-3 text-sm">
                          <Phone className="w-5 h-5 shrink-0 text-primary" />
                          <span>+90 212 999 88 77</span>
                        </li>
                    </ul>
                </div>
            </div>
            
            <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">&copy; 2026 Piinti - Engineered for Excellence</p>
                <div className="flex gap-6">
                  <span className="text-[10px] text-slate-600 font-bold tracking-tighter uppercase border border-slate-700 px-2 py-1 rounded">SSL Secure</span>
                  <span className="text-[10px] text-slate-600 font-bold tracking-tighter uppercase border border-slate-700 px-2 py-1 rounded">256-Bit Cryptography</span>
                </div>
            </div>
        </div>
   </footer>
  )
}
