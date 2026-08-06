import type { CompressFormat, PageSize } from "./types";

export const COMPRESS_FORMATS = [
  "jpeg",
  "png",
  "webp",
  "avif",
] as const satisfies readonly CompressFormat[];

export const COMPRESS_MIME_TYPES: Record<CompressFormat, string> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
};

export const MAX_COMPRESS_FILE_SIZE = 10 * 1024 * 1024;

export const PDF_MAX_FILES = 20;
export const PDF_MAX_FILE_SIZE = 30 * 1024 * 1024;
export const PDF_MAX_TOTAL_SIZE = 100 * 1024 * 1024;

export const IMAGE_SIGNATURES: Record<string, readonly number[]> = {
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/png": [0x89, 0x50, 0x4e, 0x47],
  "image/gif": [0x47, 0x49, 0x46],
};

export const AVIF_BRANDS = ["avif", "avis", "mif1"] as const;

export const ALLOWED_MIME_TYPES: readonly string[] = [
  ...Object.keys(IMAGE_SIGNATURES),
  "image/webp",
  "image/avif",
];

export const PDF_ALLOWED_TYPES: readonly string[] = ALLOWED_MIME_TYPES;

export const PAGE_SIZE_OPTIONS = [
  { value: "original", label: "Original" },
  { value: "a4", label: "A4" },
  { value: "letter", label: "Carta" },
] as const satisfies readonly { value: PageSize; label: string }[];

export const PAGE_SIZE_PT: Record<
  Exclude<PageSize, "original">,
  [number, number]
> = {
  a4: [595.28, 841.89],
  letter: [612, 792],
};
