import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { PDFDocument } from "pdf-lib";

type PageSize = "original" | "a4" | "letter";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
];

const PAGE_SIZE_PT: Record<Exclude<PageSize, "original">, [number, number]> = {
  a4: [595.28, 841.89],
  letter: [612, 792],
};

const MAX_FILES = 20;
const MAX_FILE_SIZE = 30 * 1024 * 1024;
const MAX_TOTAL_SIZE = 100 * 1024 * 1024;

class PdfError extends Error {
  constructor(
    message: string,
    public statusCode = 400,
  ) {
    super(message);
    this.name = "PdfError";
  }
}

function sanitizeFilename(name: string): string {
  const base = name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 255);
  return base.endsWith(".pdf") ? base : `${base}.pdf`;
}

function validateFiles(files: File[]): void {
  if (files.length === 0) {
    throw new PdfError("Nenhuma imagem enviada");
  }

  if (files.length > MAX_FILES) {
    throw new PdfError(`Máximo de ${MAX_FILES} imagens por PDF`);
  }

  let totalSize = 0;

  for (const file of files) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new PdfError(
        `Formato não suportado: ${file.type}. Use JPEG, PNG, WebP, AVIF ou GIF`,
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new PdfError(
        `Arquivo muito grande: ${file.name}. Máximo: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      );
    }

    totalSize += file.size;
  }

  if (totalSize > MAX_TOTAL_SIZE) {
    throw new PdfError(
      `Tamanho total excede o limite de ${MAX_TOTAL_SIZE / 1024 / 1024}MB`,
    );
  }
}

function parsePageSize(value: string | null): PageSize {
  if (value === "a4" || value === "letter") return value;
  return "original";
}

async function embedImage(
  pdfDoc: PDFDocument,
  buffer: Buffer,
  mimeType: string,
) {
  if (mimeType === "image/jpeg") {
    return pdfDoc.embedJpg(buffer);
  }

  if (mimeType === "image/png") {
    return pdfDoc.embedPng(buffer);
  }

  const pngBuffer = await sharp(buffer).png().toBuffer();
  return pdfDoc.embedPng(pngBuffer);
}

function calculateFit(
  imgWidth: number,
  imgHeight: number,
  pageWidth: number,
  pageHeight: number,
) {
  const scale = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);
  return {
    width: imgWidth * scale,
    height: imgHeight * scale,
  };
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type");
    if (!contentType?.includes("multipart/form-data")) {
      throw new PdfError("Content-Type deve ser multipart/form-data");
    }

    const formData = await request.formData();
    const files: File[] = [];
    let filename = "imagens.pdf";
    let pageSize: PageSize = "original";

    for (const [key, value] of formData.entries()) {
      if (key === "filename" && typeof value === "string") {
        filename = value;
      } else if (key === "pageSize" && typeof value === "string") {
        pageSize = parsePageSize(value);
      } else if (value instanceof File) {
        files.push(value);
      }
    }

    validateFiles(files);

    const pdfDoc = await PDFDocument.create();
    const targetSize = pageSize !== "original" ? PAGE_SIZE_PT[pageSize] : null;

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const metadata = await sharp(buffer).metadata();
      const imgWidth = metadata.width ?? 0;
      const imgHeight = metadata.height ?? 0;

      if (imgWidth === 0 || imgHeight === 0) {
        continue;
      }

      const image = await embedImage(pdfDoc, buffer, file.type);

      if (targetSize) {
        const [pw, ph] = targetSize;
        const fit = calculateFit(imgWidth, imgHeight, pw, ph);
        const page = pdfDoc.addPage([pw, ph]);
        page.drawImage(image, {
          x: (pw - fit.width) / 2,
          y: (ph - fit.height) / 2,
          width: fit.width,
          height: fit.height,
        });
      } else {
        const page = pdfDoc.addPage([imgWidth, imgHeight]);
        page.drawImage(image, {
          x: 0,
          y: 0,
          width: imgWidth,
          height: imgHeight,
        });
      }
    }

    const pdfBytes = await pdfDoc.save();

    return NextResponse.json(
      {
        data: Buffer.from(pdfBytes).toString("base64"),
        filename: sanitizeFilename(filename),
        pageCount: files.length,
        size: pdfBytes.length,
      },
      {
        headers: {
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
        },
      },
    );
  } catch (error) {
    if (error instanceof PdfError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    console.error("PDF generation error:", error);
    return NextResponse.json({ error: "Erro ao gerar PDF" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Método não permitido" }, { status: 405 });
}
