/**
 * Piinti Feature Flags
 * 
 * Yeni özellikleri canlıda test etmek veya acil durumlarda kapatmak için
 * .env dosyası üzerinden yönetilen Feature Flag altyapısı.
 */

export const FeatureFlags = {
  // AI özellikleri (.env'de ENABLE_AI_COACH=true olarak tanımlanmalı)
  ENABLE_AI_COACH: process.env.NEXT_PUBLIC_ENABLE_AI_COACH !== 'false',
  
  // Smart Price Alert (.env'de ENABLE_SMART_ALERTS=false ise gizlenir)
  ENABLE_SMART_ALERTS: process.env.NEXT_PUBLIC_ENABLE_SMART_ALERTS !== 'false',

  // UI/UX Testleri
  ENABLE_NEW_PRODUCT_LAYOUT: process.env.NEXT_PUBLIC_ENABLE_NEW_PRODUCT_LAYOUT === 'true',
};

// Frontend'de kullanımı:
// if (FeatureFlags.ENABLE_AI_COACH) { <AiCoachWidget /> }
