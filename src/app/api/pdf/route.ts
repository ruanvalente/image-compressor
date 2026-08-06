import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { PDFDocument } from "pdf-lib";
import { PAGE_SIZE_PT } from "@/lib/constants";
import { sanitizeFilename } from "@/lib/utils/filename";
import {
  ValidationError,
  validatePdfFileSignature,
  validatePdfFiles,
} from "@/lib/validation";
import type { PageSize } from "@/lib/types";

class PdfError extends Error {
  constructor(
    message: string,
    public statusCode = 400,
  ) {
    super(message);
    this.name = "PdfError";
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

    validatePdfFiles(files);

    const pdfDoc = await PDFDocument.create();
    const targetSize = pageSize !== "original" ? PAGE_SIZE_PT[pageSize] : null;
    let pageCount = 0;

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());

      validatePdfFileSignature(buffer, file);

      let metadata;
      try {
        metadata = await sharp(buffer).metadata();
      } catch {
        throw new PdfError(
          `Não foi possível ler a imagem "${file.name}". O arquivo pode estar corrompido`,
        );
      }

      const imgWidth = metadata.width ?? 0;
      const imgHeight = metadata.height ?? 0;

      if (imgWidth === 0 || imgHeight === 0) {
        continue;
      }

      let image;
      try {
        image = await embedImage(pdfDoc, buffer, file.type);
      } catch {
        throw new PdfError(
          `Não foi possível processar a imagem "${file.name}". O arquivo pode estar corrompido`,
        );
      }

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

      pageCount += 1;
    }

    const pdfBytes = await pdfDoc.save();

    return NextResponse.json(
      {
        data: Buffer.from(pdfBytes).toString("base64"),
        filename: sanitizeFilename(filename, "pdf"),
        pageCount,
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
    if (error instanceof PdfError || error instanceof ValidationError) {
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
