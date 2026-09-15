// lib/ai/gemini.ts
// Secure Gemini API integration - NO API key in frontend!

export interface AIProviderConfig {
  model: string;
  maxRetries: number;
  timeout: number;
  rateLimit: number;
}

export interface AIRequest {
  prompt: string;
  image?: string; // base64
  temperature?: number;
}

export interface AIResponse {
  ok: boolean;
  result?: string;
  error?: string;
}

// Provider interface for flexibility
export interface IAIProvider {
  configure(config: AIProviderConfig): void;
  process(request: AIRequest): Promise<AIResponse>;
  analyze(image: string): Promise<AIResponse>;
}

// Gemini Provider Implementation
export class GeminiProvider implements IAIProvider {
  private config: AIProviderConfig = {
    model: 'gemini-pro',
    maxRetries: 3,
    timeout: 30000,
    rateLimit: 100, // requests per minute
  };

  private requestCount = 0;
  private lastResetTime = Date.now();

  configure(config: AIProviderConfig): void {
    this.config = { ...this.config, ...config };
  }

  private checkRateLimit(): boolean {
    const now = Date.now();
    if (now - this.lastResetTime > 60000) {
      this.requestCount = 0;
      this.lastResetTime = now;
    }
    return this.requestCount < this.config.rateLimit;
  }

  async process(request: AIRequest): Promise<AIResponse> {
    try {
      // Rate limiting
      if (!this.checkRateLimit()) {
        return {
          ok: false,
          error: 'এই মুহূর্তে AI সার্ভিসে অনেক বেশি অনুরোধ রয়েছে। কিছুক্ষণ পরে আবার চেষ্টা করুন।',
        };
      }

      this.requestCount++;

      // Call backend API (NOT frontend)
      const response = await fetch('/api/ai/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: request.prompt,
          temperature: request.temperature || 0.7,
        }),
        signal: AbortSignal.timeout(this.config.timeout),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 429) {
          return {
            ok: false,
            error: 'এই মুহূর্তে AI সার্ভিসে অনেক বেশি অনুরোধ রয়েছে। কিছুক্ষণ পরে আবার চেষ্টা করুন।',
          };
        }
        
        if (response.status === 503) {
          return {
            ok: false,
            error: 'AI সার্ভিস বর্তমানে অপ্রাপ্য। পরে আবার চেষ্টা করুন।',
          };
        }

        return {
          ok: false,
          error: errorData.error || 'AI প্রসেসিং ব্যর্থ হয়েছে।',
        };
      }

      const data = await response.json();
      return {
        ok: true,
        result: data.result,
      };
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            ok: false,
            error: 'অনুরোধ timeout হয়েছে। দয়া করে আবার চেষ্টা করুন।',
          };
        }
      }

      return {
        ok: false,
        error: 'নেটওয়ার্ক সমস্যা হয়েছে। ইন্টারনেট সংযোগ চেক করুন।',
      };
    }
  }

  async analyze(image: string): Promise<AIResponse> {
    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image }),
        signal: AbortSignal.timeout(this.config.timeout),
      });

      if (!response.ok) {
        return {
          ok: false,
          error: 'ছবি বিশ্লেষণ ব্যর্থ হয়েছে।',
        };
      }

      const data = await response.json();
      return {
        ok: true,
        result: data.analysis,
      };
    } catch (error) {
      return {
        ok: false,
        error: 'ছবি বিশ্লেষণ সেবা উপলব্ধ নয়।',
      };
    }
  }
}

// Singleton instance
let aiProvider: GeminiProvider | null = null;

export function getAIProvider(): GeminiProvider {
  if (!aiProvider) {
    aiProvider = new GeminiProvider();
  }
  return aiProvider;
}

export function configureAIProvider(config: AIProviderConfig): void {
  getAIProvider().configure(config);
}