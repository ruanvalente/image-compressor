import { describe, expect, it } from "vitest";
import {
  calculateCompressionRatio,
  parseCompressOptions,
  validateCompressFile,
  validateFileSignature,
  validatePdfFiles,
} from "./validation";

function fileOf(name: string, size: number, type: string): File {
  return new File([new Uint8Array(size)], name, { type });
}

describe("validateFileSignature", () => {
  it("accepts a valid JPEG signature", () => {
    expect(() =>
      validateFileSignature(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]), "image/jpeg"),
    ).not.toThrow();
  });

  it("accepts a valid PNG signature", () => {
    expect(() =>
      validateFileSignature(
        new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]),
        "image/png",
      ),
    ).not.toThrow();
  });

  it("rejects content that does not match the declared MIME type", () => {
    expect(() =>
      validateFileSignature(new Uint8Array([0x00, 0x11, 0x22, 0x33]), "image/jpeg"),
    ).toThrow("não corresponde a uma imagem válida");
  });

  it("rejects MIME types without a known signature", () => {
    expect(() =>
      validateFileSignature(new Uint8Array([0x41, 0x42]), "application/pdf"),
    ).toThrow("Tipo de arquivo não suportado");
  });
});

describe("validateCompressFile", () => {
  it("rejects a missing file", () => {
    expect(() => validateCompressFile(null)).toThrow("Nenhum arquivo enviado");
  });

  it("rejects an unsupported type", () => {
    expect(() =>
      validateCompressFile(fileOf("doc.txt", 100, "text/plain")),
    ).toThrow("Tipo de arquivo não suportado");
  });

  it("rejects files larger than 10MB", () => {
    expect(() =>
      validateCompressFile(
        fileOf("big.png", 10 * 1024 * 1024 + 1, "image/png"),
      ),
    ).toThrow("Arquivo muito grande. Máximo: 10MB");
  });

  it("rejects files that are too small", () => {
    expect(() =>
      validateCompressFile(fileOf("tiny.png", 5, "image/png")),
    ).toThrow("Arquivo muito pequeno");
  });

  it("accepts a valid file", () => {
    expect(() =>
      validateCompressFile(fileOf("foto.png", 1000, "image/png")),
    ).not.toThrow();
  });
});

describe("parseCompressOptions", () => {
  it("parses valid quality and format", () => {
    expect(parseCompressOptions("80", "webp")).toEqual({
      quality: 80,
      format: "webp",
    });
  });

  it("normalizes the format to lowercase", () => {
    expect(parseCompressOptions("80", "JPEG").format).toBe("jpeg");
  });

  it("clamps quality above 100", () => {
    expect(parseCompressOptions("150", "jpeg").quality).toBe(100);
  });

  it("clamps quality below 10", () => {
    expect(parseCompressOptions("5", "jpeg").quality).toBe(10);
  });

  it("falls back to 80 when quality is not numeric", () => {
    expect(parseCompressOptions(null, "jpeg").quality).toBe(80);
    expect(parseCompressOptions("abc", "jpeg").quality).toBe(80);
  });

  it("rejects an unsupported format", () => {
    expect(() => parseCompressOptions("80", "bmp")).toThrow(
      "Formato não suportado: bmp",
    );
  });
});

describe("calculateCompressionRatio", () => {
  it("calculates a 50% reduction", () => {
    expect(calculateCompressionRatio(100, 50)).toBe(50);
  });

  it("calculates with one decimal place", () => {
    expect(calculateCompressionRatio(8610, 950)).toBe(89);
  });

  it("returns zero when there is no reduction", () => {
    expect(calculateCompressionRatio(100, 100)).toBe(0);
  });
});

describe("validatePdfFiles", () => {
  it("rejects an empty list", () => {
    expect(() => validatePdfFiles([])).toThrow("Nenhuma imagem enviada");
  });

  it("rejects more than 20 files", () => {
    const files = Array.from({ length: 21 }, (_, i) =>
      fileOf(`img-${i}.png`, 1024, "image/png"),
    );
    expect(() => validatePdfFiles(files)).toThrow("Máximo de 20 imagens");
  });

  it("rejects an unsupported type", () => {
    expect(() =>
      validatePdfFiles([fileOf("doc.txt", 1024, "text/plain")]),
    ).toThrow("Formato não suportado");
  });

  it("rejects files larger than 30MB", () => {
    expect(() =>
      validatePdfFiles([
        fileOf("big.png", 30 * 1024 * 1024 + 1, "image/png"),
      ]),
    ).toThrow("Arquivo muito grande");
  });

  it("rejects a total size above 100MB", () => {
    const files = Array.from({ length: 5 }, (_, i) =>
      fileOf(`img-${i}.png`, 25 * 1024 * 1024, "image/png"),
    );
    expect(() => validatePdfFiles(files)).toThrow(
      "Tamanho total excede o limite de 100MB",
    );
  });

  it("accepts a valid list", () => {
    const files = Array.from({ length: 3 }, (_, i) =>
      fileOf(`img-${i}.png`, 1024, "image/png"),
    );
    expect(() => validatePdfFiles(files)).not.toThrow();
  });
});
