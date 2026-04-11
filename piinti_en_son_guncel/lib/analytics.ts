export interface PricePoint {
  price: number;
  recorded_at: string;
}

export function analyzePriceTrend(history: PricePoint[], currentPrice: number) {
  if (!history || history.length < 2) return { trend: 'neutral', message: 'Yeterli veri yok' };

  const prices = history.map(h => h.price);
  const minPrice = Math.min(...prices);
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;

  if (currentPrice <= minPrice) {
    return { 
      trend: 'best', 
      message: 'Tarihinin En Düşüğü! 🔥', 
      color: 'bg-emerald-500',
      icon: '🚀'
    };
  }

  if (currentPrice < avgPrice * 0.9) {
    return { 
      trend: 'good', 
      message: 'Ciddi Düşüş Yakalandı 📉', 
      color: 'bg-blue-500',
      icon: '🎯'
    };
  }

  if (currentPrice > avgPrice * 1.1) {
    return { 
      trend: 'bad', 
      message: 'Fiyat Şu An Yüksek 📈', 
      color: 'bg-amber-500',
      icon: '⏰'
    };
  }

  return { 
    trend: 'neutral', 
    message: 'Fiyat Kararlı ⚖️', 
    color: 'bg-slate-500',
    icon: '🔍'
  };
}
