import { afterEach, describe, expect, it, vi } from "vitest";
import {
  RATE_LIMIT_MAX_REQUESTS,
  RATE_LIMIT_WINDOW_MS,
  RateLimitExceeded,
  createRateLimiter,
} from "./rate-limit";

afterEach(() => {
  vi.useRealTimers();
});

describe("createRateLimiter", () => {
  it("permite requisições dentro do limite por IP", () => {
    const rateLimit = createRateLimiter(3, RATE_LIMIT_WINDOW_MS);
    expect(() => {
      rateLimit("1.1.1.1");
      rateLimit("1.1.1.1");
      rateLimit("1.1.1.1");
    }).not.toThrow();
  });

  it("lança RateLimitExceeded ao exceder o limite com retryAfter válido", () => {
    const rateLimit = createRateLimiter(2, RATE_LIMIT_WINDOW_MS);
    rateLimit("1.1.1.1");
    rateLimit("1.1.1.1");
    try {
      rateLimit("1.1.1.1");
      expect.unreachable("deveria ter lançado RateLimitExceeded");
    } catch (error) {
      expect(error).toBeInstanceOf(RateLimitExceeded);
      expect((error as RateLimitExceeded).retryAfter).toBeGreaterThan(0);
      expect((error as RateLimitExceeded).retryAfter).toBeLessThanOrEqual(
        Math.ceil(RATE_LIMIT_WINDOW_MS / 1000),
      );
    }
  });

  it("mantém buckets independentes por IP", () => {
    const rateLimit = createRateLimiter(1, RATE_LIMIT_WINDOW_MS);
    rateLimit("1.1.1.1");
    expect(() => rateLimit("2.2.2.2")).not.toThrow();
    expect(() => rateLimit("1.1.1.1")).toThrow(RateLimitExceeded);
  });

  it("libera o IP após a janela de tempo expirar", () => {
    vi.useFakeTimers();
    const rateLimit = createRateLimiter(1, RATE_LIMIT_WINDOW_MS);
    rateLimit("1.1.1.1");
    expect(() => rateLimit("1.1.1.1")).toThrow(RateLimitExceeded);

    vi.advanceTimersByTime(RATE_LIMIT_WINDOW_MS + 1);
    expect(() => rateLimit("1.1.1.1")).not.toThrow();
  });

  it("descarta timestamps fora da janela", () => {
    vi.useFakeTimers();
    const rateLimit = createRateLimiter(2, RATE_LIMIT_WINDOW_MS);
    rateLimit("1.1.1.1");
    vi.advanceTimersByTime(RATE_LIMIT_WINDOW_MS + 1);
    rateLimit("1.1.1.1");
    expect(() => rateLimit("1.1.1.1")).not.toThrow();
  });
});

describe("limite padrão", () => {
  it("permite até RATE_LIMIT_MAX_REQUESTS requisições e bloqueia a seguinte", () => {
    const rateLimit = createRateLimiter();
    for (let i = 0; i < RATE_LIMIT_MAX_REQUESTS; i += 1) {
      rateLimit("1.1.1.1");
    }
    expect(() => rateLimit("1.1.1.1")).toThrow(RateLimitExceeded);
  });
});
