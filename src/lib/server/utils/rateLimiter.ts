import { Types } from "mongoose";

/**
 * Simple in-memory rate limiter
 * For production with multiple instances, use Redis-based solution (e.g., @upstash/ratelimit)
 */
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Check if request is within rate limit
   * @param identifier - Unique identifier (e.g., adminId, IP address)
   * @param maxRequests - Maximum number of requests allowed
   * @param windowMs - Time window in milliseconds
   * @returns { allowed: boolean, remaining: number, resetTime: number }
   */
  checkLimit(
    identifier: string,
    maxRequests: number,
    windowMs: number
  ): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const key = identifier;
    const entry = this.store.get(key);

    // If no entry or window expired, create new entry
    if (!entry || now > entry.resetTime) {
      const resetTime = now + windowMs;
      this.store.set(key, {
        count: 1,
        resetTime,
      });
      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetTime,
      };
    }

    // Check if limit exceeded
    if (entry.count >= maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
      };
    }

    // Increment count
    entry.count++;
    this.store.set(key, entry);

    return {
      allowed: true,
      remaining: maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Clear all entries (useful for testing)
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Cleanup interval on shutdown
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store.clear();
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();

/**
 * Rate limit configuration
 */
export const RATE_LIMITS = {
  UPLOAD: {
    maxRequests: 20, // 20 uploads
    windowMs: 60 * 1000, // per minute
  },
  DELETE: {
    maxRequests: 30, // 30 deletions
    windowMs: 60 * 1000, // per minute
  },
  FETCH: {
    maxRequests: 100, // 100 fetch requests
    windowMs: 60 * 1000, // per minute
  },
  UPDATE: {
    maxRequests: 50, // 50 update requests
    windowMs: 60 * 1000, // per minute
  },
} as const;







