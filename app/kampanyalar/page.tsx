"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Kampanyalar() {
  const [countdown, setCountdown] = useState("00:00:00");

  useEffect(() => {
    function updateCountdown() {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setHours(24, 0, 0, 0);
        const diff = tomorrow.getTime() - now.getTime();
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        setCountdown(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    }
    const timer = setInterval(updateCountdown, 1000);
    updateCountdown();
    return () => clearInterval(timer);
  }, []);

  const flashProducts = [
      { id: "p1", name: "iPhone 15 Pro", price: "52.999", oldPrice: "64.999", discount: "18%", image: "📱" },
      { id: "p2", name: "Samsung S24", price: "48.999", oldPrice: "59.999", discount: "18%", image: "📱" },
      { id: "p3", name: "MacBook Air", price: "42.999", oldPrice: "52.999", discount: "19%", image: "💻" },
      { id: "p4", name: "Sony WH-1000XM5", price: "10.999", oldPrice: "14.999", discount: "27%", image: "🎧" }
  ];

  return (
    <>
      <section className="gradient-bg text-white py-20">
          <div className="container mx-auto px-4 text-center">
              <h1 className="text-5xl font-bold mb-4">🔥 Güncel Kampanyalar</h1>
              <p className="text-xl text-white/90">En iyi fırsatları kaçırma!</p>
          </div>
      </section>

      <section className="py-8 bg-white">
          <div className="container mx-auto px-4">
              <div className="flex gap-4 overflow-x-auto pb-4">
                  <button className="px-6 py-3 bg-primary text-white rounded-lg font-semibold whitespace-nowrap">🔥 Tüm Kampanyalar</button>
                  <button className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold whitespace-nowrap hover:bg-gray-200">📱 Elektronik</button>
                  <button className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold whitespace-nowrap hover:bg-gray-200">👕 Moda</button>
                  <button className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold whitespace-nowrap hover:bg-gray-200">🏠 Ev & Yaşam</button>
                  <button className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold whitespace-nowrap hover:bg-gray-200">💄 Kozmetik</button>
              </div>
          </div>
      </section>

      <section className="py-12">
          <div className="container mx-auto px-4">
              <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-xl p-8 text-white mb-8 border border-red-400">
                  <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-4">
                      <h2 className="text-3xl font-bold">⚡ Flaş Fırsatlar</h2>
                      <div className="bg-white/20 px-6 py-3 rounded-lg text-center">
                          <div className="text-2xl font-bold">{countdown}</div>
                          <div className="text-sm">Kalan Süre</div>
                      </div>
                  </div>
                  <p className="text-white/90 text-lg">Sadece bugün geçerli! Hemen kaçırma!</p>
              </div>

              <div className="grid md:grid-cols-4 gap-6">
                  {flashProducts.map((product, idx) => (
                      <div key={idx} className="bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden hover:shadow-xl transition hover:scale-[1.02]">
                          <div className="relative h-48 bg-slate-100 flex items-center justify-center text-7xl">
                              {product.image}
                              <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full font-bold text-sm">
                                  {product.discount} İNDİRİM
                              </div>
                          </div>
                          <div className="p-4">
                              <h3 className="font-semibold text-gray-800 mb-3">{product.name}</h3>
                              <div className="flex items-end gap-2 mb-3">
                                  <span className="text-2xl font-bold text-red-500">{product.price} ₺</span>
                                  <span className="text-sm text-gray-400 line-through">{product.oldPrice} ₺</span>
                              </div>
                              <Link href={`/urun/${product.id}`} className="block w-full bg-red-500 hover:bg-red-600 text-white text-center py-2 rounded-lg font-semibold transition">
                                  Hemen Al
                              </Link>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      </section>

      <section className="py-12 bg-white border-t border-slate-100">
          <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold text-gray-800 mb-8">🛍️ Mağaza Kampanyaları</h2>
              <div className="grid md:grid-cols-2 gap-6">
                  <div className="border-2 border-orange-500 rounded-xl p-6 hover:shadow-lg transition">
                      <div className="flex items-center gap-4 mb-4">
                          <div className="text-5xl">🛍️</div>
                          <div>
                              <h3 className="text-2xl font-bold text-gray-800">Trendyol</h3>
                              <p className="text-orange-500 font-semibold">500 TL üzeri ücretsiz kargo</p>
                          </div>
                      </div>
                      <ul className="space-y-2 mb-4">
                          <li className="flex items-start gap-2"><span className="text-green-500">✓</span><span className="text-gray-600">Seçili ürünlerde %70'e varan indirim</span></li>
                          <li className="flex items-start gap-2"><span className="text-green-500">✓</span><span className="text-gray-600">İlk alışverişe 100 TL indirim kuponu</span></li>
                      </ul>
                      <Link href="/urunler" className="block w-full bg-orange-500 hover:bg-orange-600 text-white text-center py-3 rounded-lg font-semibold transition">
                          Kampanyalı Ürünleri Gör
                      </Link>
                  </div>
                  
                  <div className="border-2 border-orange-600 rounded-xl p-6 hover:shadow-lg transition">
                      <div className="flex items-center gap-4 mb-4">
                          <div className="text-5xl">🛒</div>
                          <div>
                              <h3 className="text-2xl font-bold text-gray-800">Hepsiburada</h3>
                              <p className="text-orange-600 font-semibold">150 TL üzeri ücretsiz kargo</p>
                          </div>
                      </div>
                      <ul className="space-y-2 mb-4">
                          <li className="flex items-start gap-2"><span className="text-green-500">✓</span><span className="text-gray-600">Elektronik ürünlerde ekstra %15 indirim</span></li>
                          <li className="flex items-start gap-2"><span className="text-green-500">✓</span><span className="text-gray-600">Hepsiburada Money ile %5 geri ödeme</span></li>
                      </ul>
                      <Link href="/urunler" className="block w-full bg-orange-600 hover:bg-orange-700 text-white text-center py-3 rounded-lg font-semibold transition">
                          Kampanyalı Ürünleri Gör
                      </Link>
                  </div>
              </div>
          </div>
      </section>
      
      <section className="py-16 gradient-bg">
          <div className="container mx-auto px-4 text-center text-white">
              <h2 className="text-3xl font-bold mb-4">📧 Kampanyalardan Haberdar Ol!</h2>
              <p className="text-xl text-white/90 mb-8">En yeni fırsatları ilk sen öğren</p>
              <form className="max-w-md mx-auto flex gap-3" onSubmit={(e) => e.preventDefault()}>
                  <input type="email" placeholder="E-posta adresiniz" className="flex-1 px-6 py-3 rounded-lg text-gray-800 outline-none focus:ring-2 focus:ring-accent" />
                  <button className="bg-accent hover:bg-accent/90 text-white px-8 py-3 rounded-lg font-semibold transition shadow">Abone Ol</button>
              </form>
          </div>
      </section>
    </>
  );
}
