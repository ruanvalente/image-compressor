import type { NextRequest } from "next/server";

export const RATE_LIMIT_WINDOW_MS = 60_000;
export const RATE_LIMIT_MAX_REQUESTS = 30;

export class RateLimitExceeded extends Error {
  constructor(public retryAfter: number) {
    super("Muitas requisições. Aguarde alguns segundos e tente novamente");
    this.name = "RateLimitExceeded";
  }
}

interface RateLimitBucket {
  timestamps: number[];
}

export function createRateLimiter(
  maxRequests = RATE_LIMIT_MAX_REQUESTS,
  windowMs = RATE_LIMIT_WINDOW_MS,
) {
  const buckets = new Map<string, RateLimitBucket>();

  return function rateLimit(ip: string): void {
    const now = Date.now();
    const bucket = buckets.get(ip);
    const timestamps =
      bucket?.timestamps.filter((t) => now - t < windowMs) ?? [];
    const oldest = timestamps[0];

    if (timestamps.length >= maxRequests) {
      const retryAfter = Math.ceil((oldest + windowMs - now) / 1000);
      throw new RateLimitExceeded(retryAfter);
    }

    timestamps.push(now);
    buckets.set(ip, { timestamps });
  };
}

export const rateLimit = createRateLimiter();

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
