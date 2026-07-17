import { supabase } from '@/lib/supabase';
import { AiCoachAnalysis } from './provider';
import { OpenAIProvider } from './openai';
import { AI_COACH_SYSTEM_PROMPT } from './prompts';

// ─── Promise Deduplication & In-Memory Cache ────────────────────────
// Aynı ürüne aynı anda gelen yüzlerce isteği TEK bir OpenAI çağrısında birleştirir.
// Cache TTL: 24 Saat. Prodüksiyonda Redis'e çevrilebilir.
const analysisCache = new Map<string, { promise: Promise<AiCoachAnalysis>; timestamp: number }>();
const CACHE_TTL_MS = 1000 * 60 * 60 * 24; 

export class AiCoachService {
  private provider: OpenAIProvider;

  constructor() {
    this.provider = new OpenAIProvider();
  }

  /**
   * Main entry point for the API route.
   */
  async getProductAnalysis(productId: string): Promise<AiCoachAnalysis> {
    const now = Date.now();
    const cached = analysisCache.get(productId);

    // 1. Cache veya devam eden istek (Promise) kontrolü
    if (cached && (now - cached.timestamp < CACHE_TTL_MS)) {
      return cached.promise;
    }

    // 2. Yeni İstek - Promise Deduplication Başlangıcı
    const promise = this._generateAnalysisAndCost(productId);
    analysisCache.set(productId, { promise, timestamp: now });

    try {
      return await promise;
    } catch (err) {
      // Hata durumunda cache'den sil ki sonraki istekler tekrar deneyebilsin
      analysisCache.delete(productId);
      throw err;
    }
  }

  private async _generateAnalysisAndCost(productId: string): Promise<AiCoachAnalysis> {
    // 1. Ham Verileri Topla (Supabase)
    const contextData = await this.gatherProductContext(productId);

    // 2. Güvenlik: Input Sanitization (Eğer kullanıcıdan serbest metin gelseydi burada temizlenecekti)
    // Şimdilik sadece ürün ID bazlı context çektiğimiz için Prompt Injection riski minimal.

    // 3. AI Sağlayıcısına Gönder
    const startTime = Date.now();
    const analysis = await this.provider.generateAnalysis(
      AI_COACH_SYSTEM_PROMPT,
      JSON.stringify(contextData)
    );
    const duration = Date.now() - startTime;

    // TODO (Monitoring): Maliyet ve latency takibi için log bas:
    // console.log(`[AI Cost Audit] Product: ${productId} | Duration: ${duration}ms | Engine: OpenAI`);

    return analysis;
  }

  /**
   * Supabase'den ürünle ilgili tüm özellikleri, fiyatları, geçmişi ve benzer ürünleri toplar.
   */
  private async gatherProductContext(productId: string) {
    const { data: product, error } = await supabase
      .from('products')
      .select(`
        id, title, description, rating, reviews_count,
        brands (name),
        categories (id, name),
        product_prices (price, vendors(name)),
        price_history (price, date)
      `)
      .eq('id', productId)
      .single();

    if (error || !product) {
      throw new Error('Product not found for AI analysis');
    }

    // Aynı kategorideki benzer/rakip ürünleri çek (Fiyatı benzer olanlar)
    let competitors: { title: string; currentMinPrice: number | null }[] = [];
    if (product.categories) {
      const catId = Array.isArray(product.categories) ? product.categories[0].id : (product.categories as any).id;
      
      const { data: similarProducts } = await supabase
        .from('products')
        .select('title, product_prices(price)')
        .eq('category_id', catId)
        .neq('id', productId)
        .limit(5);

      competitors = (similarProducts || []).map(sp => {
        const prices = (sp.product_prices || []).map((p: any) => p.price);
        const minPrice = prices.length > 0 ? Math.min(...prices) : null;
        return { title: sp.title, currentMinPrice: minPrice };
      });
    }

    // Fiyatları düzelt
    const currentPrices = (product.product_prices || []).map((p: any) => ({
      vendor: p.vendors?.name,
      price: p.price
    }));
    
    // Fiyat geçmişi (Sadece son 90 gün gibi sıralayabiliriz)
    const priceHistory = (product.price_history || [])
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 30); // Son 30 hareket

    return {
      productTitle: product.title,
      brand: Array.isArray(product.brands) ? product.brands[0]?.name : (product.brands as any)?.name,
      category: Array.isArray(product.categories) ? product.categories[0]?.name : (product.categories as any)?.name,
      rating: product.rating,
      reviewsCount: product.reviews_count,
      currentPrices: currentPrices,
      priceHistory: priceHistory,
      competitors: competitors
    };
  }
}
