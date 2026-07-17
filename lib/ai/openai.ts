import { AiCoachAnalysis, IAICoachProvider } from './provider';

export class OpenAIProvider implements IAICoachProvider {
  private apiKey: string;
  private model: string;
  private maxRetries: number = 3;
  private timeoutMs: number = 15000;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
    this.model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  }

  async generateAnalysis(systemPrompt: string, contextData: string): Promise<AiCoachAnalysis> {
    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY is not defined in .env');
    }

    let attempt = 0;
    while (attempt < this.maxRetries) {
      attempt++;
      try {
        return await this.fetchFromOpenAI(systemPrompt, contextData);
      } catch (error: any) {
        if (attempt >= this.maxRetries) {
          console.error(`[OpenAIProvider] Max retries reached: ${error.message}`);
          throw new Error('AI Provider failed to respond after retries.');
        }
        console.warn(`[OpenAIProvider] Attempt ${attempt} failed, retrying... (${error.message})`);
        // Bekleme süresi (Exponential backoff)
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
    
    throw new Error('AI Provider failed.');
  }

  private async fetchFromOpenAI(systemPrompt: string, contextData: string): Promise<AiCoachAnalysis> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: contextData }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1 // Halüsinasyon riskini en aza indirmek için
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`OpenAI API Error: ${response.status} - ${errBody}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        throw new Error('No content returned from OpenAI');
      }

      // JSON parsing (Structure should be enforced by response_format & prompt)
      return JSON.parse(content) as AiCoachAnalysis;

    } finally {
      clearTimeout(timeoutId);
    }
  }
}
