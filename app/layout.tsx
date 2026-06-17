// Piinti - Türkiye'nin Akıllı Fiyat Karşılaştırma Motoru (Redeploy Trigger)
import type { Metadata } from "next";
import "./globals.css";
import Link from 'next/link';
import Image from 'next/image';
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
  Facebook,
  BookOpen
} from 'lucide-react';
import Navbar from './components/Navbar';
import GoogleAnalytics from './components/GoogleAnalytics';
import { Suspense } from 'react';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.piinti.com'),
  title: {
    default: "Piinti | Türkiye'nin En Şeffaf Fiyat Karşılaştırma Platformu",
    template: "%s | Piinti"
  },
  description: "Milyonlarca ürünü, yüzlerce mağazayı anlık analiz edin. Piinti ile en ucuz fiyatı, fiyat geçmişini ve kullanıcı yorumlarını tek adreste bulun.",
  openGraph: {
    title: "Piinti | Akıllı Alışveriş ve Fiyat Karşılaştırma",
    description: "Sınıfının en iyisi yapay zeka destekli fiyat analizi ile tasarruf etmeye bugün başlayın.",
    url: "https://www.piinti.com",
    siteName: "Piinti",
    locale: "tr_TR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Piinti | Akıllı Alışverişin Ayrıcalıklı Adresi",
    description: "Kaliteden ödün vermeden en iyi fiyata ulaşın.",
  },
  alternates: {
    canonical: 'https://www.piinti.com',
  },
  verification: {
    google: "5TdZaOAWcRe2uFNBAaQeuJRV9jrGhnu_gPKcj6NtJoc",
  },
  other: {
    'verify-admitad': ['e3ccfa16cb'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className="bg-gray-50 font-sans antialiased text-slate-900">
        <Suspense fallback={null}>
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID || ""} />
        </Suspense>
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


function Footer() {
  return (
    <footer className="bg-slate-900 text-white pt-20 pb-10">
        <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-12 mb-16">
                <div className="col-span-1 md:col-span-1">
                    <Link href="/" className="inline-block mb-6 relative w-[140px] h-[45px]">
                      <Image 
                        src="/logo.png" 
                        alt="Piinti Logo" 
                        fill 
                        className="object-contain filter brightness-0 invert opacity-90"
                      />
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
                        <li><Link href="/blog" className="text-slate-400 hover:text-white transition-colors flex items-center gap-3 text-sm underline-offset-4 hover:underline"><BookOpen className="w-4 h-4" /> Rehber & Blog</Link></li>
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
