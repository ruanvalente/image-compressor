import { afterEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;

function unsetSiteUrl() {
  delete process.env.NEXT_PUBLIC_SITE_URL;
}

afterEach(() => {
  if (ORIGINAL_SITE_URL === undefined) {
    unsetSiteUrl();
  } else {
    process.env.NEXT_PUBLIC_SITE_URL = ORIGINAL_SITE_URL;
  }
  vi.resetModules();
});

describe("SITE_URL", () => {
  it("usa o valor de NEXT_PUBLIC_SITE_URL removendo a barra final", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://example.com/";
    const { SITE_URL } = await import("./site-url");
    expect(SITE_URL).toBe("https://example.com");
  });

  it("usa o fallback padrão quando a env não está definida", async () => {
    unsetSiteUrl();
    const { SITE_URL } = await import("./site-url");
    expect(SITE_URL).toBe("https://image-compressor-web.netlify.app");
  });
});
