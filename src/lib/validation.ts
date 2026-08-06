import {
  ALLOWED_MIME_TYPES,
  AVIF_BRANDS,
  COMPRESS_FORMATS,
  IMAGE_SIGNATURES,
  MAX_COMPRESS_FILE_SIZE,
  PDF_ALLOWED_TYPES,
  PDF_MAX_FILES,
  PDF_MAX_FILE_SIZE,
  PDF_MAX_TOTAL_SIZE,
} from "./constants";
import type { CompressFormat } from "./types";

export class ValidationError extends Error {
  constructor(
    message: string,
    public statusCode = 400,
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

function invalidContentError(): ValidationError {
  return new ValidationError(
    "Arquivo inválido. O conteúdo não corresponde a uma imagem válida",
  );
}

function validateAvifSignature(buffer: Uint8Array): void {
  const ftyp = [0x66, 0x74, 0x79, 0x70];
  if (
    buffer.length < 12 ||
    ftyp.some((byte, i) => buffer[i + 4] !== byte)
  ) {
    throw invalidContentError();
  }

  const brand = String.fromCharCode(
    buffer[8],
    buffer[9],
    buffer[10],
    buffer[11],
  ) as (typeof AVIF_BRANDS)[number];

  if (!AVIF_BRANDS.includes(brand)) {
    throw invalidContentError();
  }
}

function validateWebpSignature(buffer: Uint8Array): void {
  const riff = [0x52, 0x49, 0x46, 0x46];
  const webp = [0x57, 0x45, 0x42, 0x50];
  const matches = (bytes: number[], offset: number) =>
    bytes.some((byte, i) => buffer[i + offset] !== byte);

  if (
    buffer.length < 12 ||
    matches(riff, 0) ||
    matches(webp, 8)
  ) {
    throw invalidContentError();
  }
}

export function validateFileSignature(
  buffer: Uint8Array,
  mimeType: string,
): void {
  if (mimeType === "image/avif") {
    validateAvifSignature(buffer);
    return;
  }

  if (mimeType === "image/webp") {
    validateWebpSignature(buffer);
    return;
  }

  const signature = IMAGE_SIGNATURES[mimeType];
  if (!signature) {
    throw new ValidationError("Tipo de arquivo não suportado");
  }

  for (let i = 0; i < signature.length; i++) {
    if (buffer[i] !== signature[i]) {
      throw invalidContentError();
    }
  }
}

export function validatePdfFileSignature(
  buffer: Uint8Array,
  file: File,
): void {
  try {
    validateFileSignature(buffer, file.type);
  } catch (error) {
    if (error instanceof ValidationError) {
      throw new ValidationError(`${file.name}: ${error.message}`);
    }
    throw error;
  }
}

export function validateCompressFile(file: File | null): asserts file is File {
  if (!file) {
    throw new ValidationError("Nenhum arquivo enviado");
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new ValidationError(
      "Tipo de arquivo não suportado. Use JPEG, PNG, WebP, GIF ou AVIF",
    );
  }

  if (file.size > MAX_COMPRESS_FILE_SIZE) {
    throw new ValidationError(
      `Arquivo muito grande. Máximo: ${MAX_COMPRESS_FILE_SIZE / 1024 / 1024}MB`,
    );
  }

  if (file.size < 12) {
    throw new ValidationError("Arquivo muito pequeno para ser uma imagem");
  }
}

export function parseCompressOptions(
  qualityRaw: FormDataEntryValue | null,
  formatRaw: FormDataEntryValue | null,
): { quality: number; format: CompressFormat } {
  const quality = Math.max(
    10,
    Math.min(100, parseInt(String(qualityRaw)) || 80),
  );
  const format = String(formatRaw).toLowerCase() as CompressFormat;

  if (!COMPRESS_FORMATS.includes(format)) {
    const received = formatRaw ? `: ${format}` : "";
    throw new ValidationError(
      `Formato não suportado${received}. Use: ${COMPRESS_FORMATS.join(", ")}`,
    );
  }

  return { quality, format };
}

export function calculateCompressionRatio(
  originalSize: number,
  compressedSize: number,
): number {
  const ratio = (1 - compressedSize / originalSize) * 100;
  return Math.round(ratio * 10) / 10;
}

export function validatePdfFiles(files: File[]): void {
  if (files.length === 0) {
    throw new ValidationError("Nenhuma imagem enviada");
  }

  if (files.length > PDF_MAX_FILES) {
    throw new ValidationError(`Máximo de ${PDF_MAX_FILES} imagens por PDF`);
  }

  let totalSize = 0;

  for (const file of files) {
    if (!PDF_ALLOWED_TYPES.includes(file.type)) {
      throw new ValidationError(
        `Formato não suportado: ${file.type}. Use JPEG, PNG, WebP, AVIF ou GIF`,
      );
    }

    if (file.size > PDF_MAX_FILE_SIZE) {
      throw new ValidationError(
        `Arquivo muito grande: ${file.name}. Máximo: ${PDF_MAX_FILE_SIZE / 1024 / 1024}MB`,
      );
    }

    totalSize += file.size;
  }

  if (totalSize > PDF_MAX_TOTAL_SIZE) {
    throw new ValidationError(
      `Tamanho total excede o limite de ${PDF_MAX_TOTAL_SIZE / 1024 / 1024}MB`,
    );
  }
}
