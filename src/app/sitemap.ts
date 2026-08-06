import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://image-compressor-web.netlify.app/",
      lastModified: new Date("2026-04-26"),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
