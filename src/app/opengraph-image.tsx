import { ImageResponse } from "next/og";
import { OgImage } from "@/components/ui";

export const alt = "Image Compressor — Comprimir imagens online";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(<OgImage />, { ...size });
}
