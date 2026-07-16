export interface PricePoint {
  price: number;
  date: string; // Veya recorded_at
}

export function analyzePriceTrend(history: PricePoint[], currentPrice: number) {
  if (!history || history.length < 3) {
    return { 
      trend: 'neutral', 
      title: 'Veri Toplanıyor', 
      message: 'Bu ürün için henüz yeterli fiyat geçmişi oluşmadı. Fiyat alarmı kurabilirsiniz.', 
      dropProbability: 0,
      color: 'slate',
      actionText: 'Alarm Kur'
    };
  }

  // Fiyatları çek ve sırala (Matematiksel analiz için)
  const prices = history.map(h => h.price).sort((a, b) => a - b);
  
  // İstatistikler
  const minPrice = prices[0];
  const maxPrice = prices[prices.length - 1];
  
  // Medyan (Ortancayı bul) - Aşırı uçları (spike) engeller
  const mid = Math.floor(prices.length / 2);
  const medianPrice = prices.length % 2 !== 0 ? prices[mid] : (prices[mid - 1] + prices[mid]) / 2;
  
  // Standart Sapma Hesaplama (Volatilite)
  const mean = prices.reduce((acc, val) => acc + val, 0) / prices.length;
  const variance = prices.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / prices.length;
  const stdDev = Math.sqrt(variance);

  // Fiyatın zirveden ne kadar uzakta olduğu (Düşme Olasılığı)
  // Eğer fiyat maks fiyata yakınsa, düşme olasılığı yüksektir. 
  // Eğer fiyat min fiyata yakınsa, düşme olasılığı düşüktür.
  let dropProbability = 0;
  if (maxPrice > minPrice) {
    // Fiyatın zirveye olan yakınlığı % olarak (0 = dip, 100 = zirve)
    const positionPercent = ((currentPrice - minPrice) / (maxPrice - minPrice)) * 100;
    
    // Eğer fiyat zirvedeyse düşme olasılığı yüksektir.
    // Basit bir sigmoid veya lineer ters orantı kullanıyoruz.
    dropProbability = Math.round(positionPercent * 0.85); // Zirvedeyse %85 ihtimalle düşer
  }

  // 1. Durum: Fiyat Dipte (Tarihi Düşük)
  if (currentPrice <= minPrice * 1.02) { // %2 opsiyon payı
    return { 
      trend: 'best', 
      title: 'Fiyat Dip Seviyede!', 
      message: 'Şu an son 3 ayın en düşük fiyatında. Fiyatın daha fazla düşme ihtimali çok düşük.', 
      dropProbability: 5, // Düşme ihtimali %5
      color: 'emerald',
      actionText: 'Hemen Al'
    };
  }

  // 2. Durum: Fiyat Zirvede veya Zirveye Yakın (Bekle)
  if (currentPrice > medianPrice + (stdDev * 0.5)) {
    return { 
      trend: 'bad', 
      title: 'Fiyat Şu An Zirvelerde', 
      message: `Ürün ortalamanın oldukça üzerinde. Tahminimize göre önümüzdeki 15 gün içinde fiyat düşme olasılığı %${dropProbability}.`, 
      dropProbability: dropProbability,
      color: 'rose',
      actionText: 'Alarm Kur ve Bekle'
    };
  }

  // 3. Durum: Fiyat Ortalama / Stabil (İndirim Yakın Olabilir)
  if (currentPrice < medianPrice) {
    return { 
      trend: 'good', 
      title: 'Fiyat Uygun Seviyede', 
      message: 'Fiyat şu an genel ortalamanın altında. Satın almak için mantıklı bir dönemdesiniz.', 
      dropProbability: 35,
      color: 'indigo',
      actionText: 'Satın Alınabilir'
    };
  }

  // Varsayılan: Stabil
  return { 
    trend: 'neutral', 
    title: 'Fiyat Stabil', 
    message: 'Fiyat uzun süredir yatay seyrediyor. Acil değilse fiyat alarmı kurarak indirimi bekleyebilirsiniz.', 
    dropProbability: 50,
    color: 'slate',
    actionText: 'Takibe Al'
  };
}
