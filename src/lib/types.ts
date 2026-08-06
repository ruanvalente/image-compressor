export type CompressFormat = "jpeg" | "png" | "webp" | "avif";

export type PageSize = "original" | "a4" | "letter";

export interface CompressionResult {
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  format: CompressFormat;
  filename: string;
  data: string;
}

export interface CompressionSettings {
  quality: number;
  format: CompressFormat;
}

export interface PdfResult {
  data: string;
  filename: string;
  pageCount: number;
  size: number;
}
