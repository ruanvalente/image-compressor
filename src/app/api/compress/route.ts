import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { sanitizeFilename } from "@/lib/utils/filename";
import {
  ValidationError,
  calculateCompressionRatio,
  parseCompressOptions,
  validateCompressFile,
  validateFileSignature,
} from "@/lib/validation";
import type { CompressionResult } from "@/lib/types";
import { RateLimitExceeded, getClientIp, rateLimit } from "@/lib/rate-limit";

interface CompressionResponse extends CompressionResult {
  success: true;
}

interface CompressionError {
  success: false;
  error: string;
}

async function compressImage(
  buffer: Buffer,
  options: { quality: number; format: CompressionResult["format"] },
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

async function verifyContentType(request: NextRequest): Promise<void> {
  const contentType = request.headers.get("content-type");
  if (!contentType || !contentType.includes("multipart/form-data")) {
    throw new ValidationError("Content-Type inválido");
  }
}

export async function POST(request: NextRequest) {
  try {
    rateLimit(getClientIp(request));

    await verifyContentType(request);

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    validateCompressFile(file);

    const { quality, format } = parseCompressOptions(
      formData.get("quality"),
      formData.get("format"),
    );

    const buffer = Buffer.from(await file.arrayBuffer());

    validateFileSignature(buffer, file.type);

    const outputBuffer = await compressImage(buffer, { quality, format });

    const originalSize = buffer.length;
    const compressedSize = outputBuffer.length;
    const compressionRatio = calculateCompressionRatio(
      originalSize,
      compressedSize,
    );

    const response: CompressionResponse = {
      success: true,
      originalSize,
      compressedSize,
      compressionRatio,
      format,
      filename: sanitizeFilename(file.name, format),
      data: outputBuffer.toString("base64"),
    };

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof RateLimitExceeded) {
      return NextResponse.json(
        { success: false, error: error.message } satisfies CompressionError,
        {
          status: 429,
          headers: { "Retry-After": String(error.retryAfter) },
        },
      );
    }

    if (error instanceof ValidationError) {
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
