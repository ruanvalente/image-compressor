import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

const SUPPORTED_FORMATS = ["jpeg", "png", "webp", "avif"] as const;
type ImageFormat = (typeof SUPPORTED_FORMATS)[number];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const IMAGE_SIGNATURES: Record<string, number[]> = {
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/png": [0x89, 0x50, 0x4e, 0x47],
  "image/webp": [0x57, 0x45, 0x42, 0x50],
  "image/gif": [0x47, 0x49, 0x46],
  "image/avif": [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70],
};

const ALLOWED_MIME_TYPES = Object.keys(IMAGE_SIGNATURES);

interface CompressionOptions {
  quality: number;
  format: ImageFormat;
}

interface CompressionResult {
  success: true;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  format: ImageFormat;
  filename: string;
  data: string;
}

interface CompressionError {
  success: false;
  error: string;
}

class FileValidationError extends Error {
  constructor(
    message: string,
    public statusCode = 400,
  ) {
    super(message);
    this.name = "FileValidationError";
  }
}

function validateFileSignature(buffer: Buffer, mimeType: string): void {
  const signature = IMAGE_SIGNATURES[mimeType];
  if (!signature) {
    throw new FileValidationError("Tipo de arquivo não suportado");
  }

  for (let i = 0; i < signature.length; i++) {
    if (buffer[i] !== signature[i]) {
      throw new FileValidationError(
        "Arquivo inválido. O conteúdo não corresponde a uma imagem válida",
      );
    }
  }
}

function validateFile(file: File | null): asserts file is File {
  if (!file) {
    throw new FileValidationError("Nenhum arquivo enviado");
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new FileValidationError(
      "Tipo de arquivo não suportado. Use JPEG, PNG, WebP, GIF ou AVIF",
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new FileValidationError(
      `Arquivo muito grande. Máximo: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    );
  }

  if (file.size < 12) {
    throw new FileValidationError("Arquivo muito pequeno para ser uma imagem");
  }
}

function parseOptions(formData: FormData): CompressionOptions {
  const quality = Math.max(
    10,
    Math.min(100, parseInt(formData.get("quality") as string) || 80),
  );
  const format = (
    formData.get("format") as string
  )?.toLowerCase() as ImageFormat;

  if (!SUPPORTED_FORMATS.includes(format)) {
    throw new FileValidationError(
      `Formato não suportado: ${format}. Use: ${SUPPORTED_FORMATS.join(", ")}`,
    );
  }

  return { quality, format };
}

async function compressImage(
  buffer: Buffer,
  options: CompressionOptions,
): Promise<Buffer> {
  const { quality, format } = options;
  const clampedQuality = Math.min(quality, 100);

  const sharpInstance = sharp(buffer);

  switch (format) {
    case "png":
      return sharpInstance
        .png({ quality: clampedQuality, compressionLevel: 9 })
        .toBuffer();
    case "webp":
      return sharpInstance.webp({ quality: clampedQuality }).toBuffer();
    case "avif":
      return sharpInstance.avif({ quality: clampedQuality }).toBuffer();
    case "jpeg":
      return sharpInstance
        .jpeg({ quality: clampedQuality, mozjpeg: true })
        .toBuffer();
  }
}

function calculateCompressionRatio(
  originalSize: number,
  compressedSize: number,
): number {
  const ratio = (1 - compressedSize / originalSize) * 100;
  return Math.round(ratio * 10) / 10;
}

function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 255)
    .replace(/\.[^.]+$/, "");
}

async function verifyContentType(request: NextRequest): Promise<void> {
  const contentType = request.headers.get("content-type");
  if (!contentType || !contentType.includes("multipart/form-data")) {
    throw new FileValidationError("Content-Type inválido");
  }
}

export async function POST(request: NextRequest) {
  try {
    await verifyContentType(request);

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    validateFile(file);

    const { quality, format } = parseOptions(formData);

    const buffer = Buffer.from(await file.arrayBuffer());

    validateFileSignature(buffer, file.type);

    const baseFilename = sanitizeFilename(file.name);

    const outputBuffer = await compressImage(buffer, { quality, format });

    const originalSize = buffer.length;
    const compressedSize = outputBuffer.length;
    const compressionRatio = calculateCompressionRatio(
      originalSize,
      compressedSize,
    );

    const response: CompressionResult = {
      success: true,
      originalSize,
      compressedSize,
      compressionRatio,
      format,
      filename: `${baseFilename}.${format}`,
      data: outputBuffer.toString("base64"),
    };

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof FileValidationError) {
      return NextResponse.json(
        { success: false, error: error.message } satisfies CompressionError,
        { status: error.statusCode },
      );
    }

    console.error("Compression error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao comprimir imagem",
      } satisfies CompressionError,
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: "Método não permitido",
    } satisfies CompressionError,
    { status: 405 },
  );
}