import { describe, expect, it } from "vitest";
import { sanitizeFilename } from "./filename";

describe("sanitizeFilename", () => {
  it("replaces invalid characters with underscores", () => {
    expect(sanitizeFilename("minha foto!@#.png", "webp")).toBe(
      "minha_foto___.webp",
    );
  });

  it("removes the original extension when none is provided", () => {
    expect(sanitizeFilename("imagem.png")).toBe("imagem");
  });

  it("appends the provided extension to a name without one", () => {
    expect(sanitizeFilename("foto.png", "avif")).toBe("foto.avif");
  });

  it("adds .pdf when the pdf extension is requested", () => {
    expect(sanitizeFilename("relatório final", "pdf")).toBe(
      "relat_rio_final.pdf",
    );
  });

  it("keeps behavior for names already ending in .pdf", () => {
    expect(sanitizeFilename("relatorio.pdf", "pdf")).toBe("relatorio.pdf");
  });

  it("truncates names longer than 255 characters", () => {
    const long = `${"a".repeat(300)}.png`;
    const result = sanitizeFilename(long, "jpeg");
    expect(result).toBe(`${"a".repeat(255)}.jpeg`);
  });
});
