// lib/security/rateLimiter.ts
// Server-side rate limiting

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  keyGenerator: (req: any) => string; // Generate unique key (IP, user ID, etc.)
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

export class RateLimiter {
  private store: Map<string, { count: number; resetTime: number }> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  check(req: any): RateLimitResult {
    const key = this.config.keyGenerator(req);
    const now = Date.now();
    let entry = this.store.get(key);

    if (!entry || now > entry.resetTime) {
      entry = { count: 0, resetTime: now + this.config.windowMs };
      this.store.set(key, entry);
    }

    const allowed = entry.count < this.config.maxRequests;
    if (allowed) {
      entry.count++;
    }

    return {
      allowed,
      remaining: Math.max(0, this.config.maxRequests - entry.count),
      resetTime: entry.resetTime,
    };
  }

  reset(key: string): void {
    this.store.delete(key);
  }

  // Cleanup old entries periodically
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }
}