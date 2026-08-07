const DEFAULT_SITE_URL = "https://image-compressor-web.netlify.app";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL
).replace(/\/+$/, "");
