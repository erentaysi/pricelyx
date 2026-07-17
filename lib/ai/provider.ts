export interface AiCoachAnalysis {
  targetAudience: string;
  pros: string[];
  cons: string[];
  pricePerformanceScore: number;
  competitorComparison: string;
  betterAlternatives: { name: string; reason: string }[];
  priceHistorySummary: string;
  isWorthBuyingNow: boolean;
  buyAdvice: string;
}

export interface IAICoachProvider {
  /**
   * Generates a structured JSON analysis for a product based on context.
   */
  generateAnalysis(systemPrompt: string, contextData: string): Promise<AiCoachAnalysis>;
}
