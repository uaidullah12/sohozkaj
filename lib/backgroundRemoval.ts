// lib/ai/backgroundRemoval.ts
// Background Removal Provider - Abstraction layer for multiple services

export interface BackgroundRemovalConfig {
  provider: 'cutout' | 'removebg' | 'none';
  apiKey?: string;
  timeout: number;
}

export interface RemovalRequest {
  image: string; // base64 or file path
  backgroundColor?: string;
}

export interface RemovalResponse {
  ok: boolean;
  image?: string;
  error?: string;
}

export interface IBackgroundRemovalProvider {
  configure(config: BackgroundRemovalConfig): void;
  remove(request: RemovalRequest): Promise<RemovalResponse>;
}

// Cutout.Pro Implementation
export class CutoutProProvider implements IBackgroundRemovalProvider {
  private config: BackgroundRemovalConfig = {
    provider: 'cutout',
    timeout: 60000,
  };

  configure(config: BackgroundRemovalConfig): void {
    this.config = { ...this.config, ...config };
  }

  async remove(request: RemovalRequest): Promise<RemovalResponse> {
    try {
      if (!this.config.apiKey) {
        return {
          ok: false,
          error: 'Cutout.Pro API কী কনফিগার করা হয়নি।',
        };
      }

      const response = await fetch('/api/remove-bg/cutout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: request.image,
          backgroundColor: request.backgroundColor,
        }),
        signal: AbortSignal.timeout(this.config.timeout),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        return {
          ok: false,
          error: error.error || 'ব্যাকগ্রাউন্ড রিমুভ করা যায়নি।',
        };
      }

      const data = await response.json();
      return {
        ok: true,
        image: data.image,
      };
    } catch (error) {
      return {
        ok: false,
        error: 'ব্যাকগ্রাউন্ড রিমুভ সেবা অনুপলব্ধ।',
      };
    }
  }
}

// Remove.bg Implementation
export class RemoveBgProvider implements IBackgroundRemovalProvider {
  private config: BackgroundRemovalConfig = {
    provider: 'removebg',
    timeout: 60000,
  };

  configure(config: BackgroundRemovalConfig): void {
    this.config = { ...this.config, ...config };
  }

  async remove(request: RemovalRequest): Promise<RemovalResponse> {
    try {
      if (!this.config.apiKey) {
        return {
          ok: false,
          error: 'Remove.bg API কী কনফিগার করা হয়নি।',
        };
      }

      const response = await fetch('/api/remove-bg/removebg', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: request.image,
        }),
        signal: AbortSignal.timeout(this.config.timeout),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        return {
          ok: false,
          error: error.error || 'ব্যাকগ্রাউন্ড রিমুভ করা যায়নি।',
        };
      }

      const data = await response.json();
      return {
        ok: true,
        image: data.image,
      };
    } catch (error) {
      return {
        ok: false,
        error: 'ব্যাকগ্রাউন্ড রিমুভ সেবা অনুপলব্ধ।',
      };
    }
  }
}

// No-op Provider (when service not configured)
export class NoBackgroundRemovalProvider implements IBackgroundRemovalProvider {
  configure(_config: BackgroundRemovalConfig): void {}

  async remove(_request: RemovalRequest): Promise<RemovalResponse> {
    return {
      ok: false,
      error: 'ব্যাকগ্রাউন্ড রিমুভ সার্ভিস বর্তমানে কনফিগার করা হয়নি।',
    };
  }
}

// Factory
let bgProvider: IBackgroundRemovalProvider | null = null;

export function getBackgroundRemovalProvider(): IBackgroundRemovalProvider {
  if (!bgProvider) {
    const provider = process.env.NEXT_PUBLIC_BG_REMOVAL_PROVIDER || 'none';
    
    if (provider === 'cutout') {
      bgProvider = new CutoutProProvider();
    } else if (provider === 'removebg') {
      bgProvider = new RemoveBgProvider();
    } else {
      bgProvider = new NoBackgroundRemovalProvider();
    }
  }
  return bgProvider;
}

export function configureBackgroundRemovalProvider(
  config: BackgroundRemovalConfig
): void {
  bgProvider = null; // Reset
  const provider = config.provider;

  if (provider === 'cutout') {
    bgProvider = new CutoutProProvider();
  } else if (provider === 'removebg') {
    bgProvider = new RemoveBgProvider();
  } else {
    bgProvider = new NoBackgroundRemovalProvider();
  }

  bgProvider.configure(config);
}
