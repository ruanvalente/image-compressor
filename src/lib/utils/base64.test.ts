import { describe, expect, it } from "vitest";
import { base64ToBlob } from "./base64";

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

describe("base64ToBlob", () => {
  it("decodes base64 content with the correct MIME type", async () => {
    const blob = base64ToBlob("SGVsbG8=", "text/plain");
    expect(blob.type).toBe("text/plain");
    expect(blob.size).toBe(5);
    expect(await blob.text()).toBe("Hello");
  });

  it("supports empty input", () => {
    const blob = base64ToBlob("", "application/pdf");
    expect(blob.size).toBe(0);
  });

  it("decodes buffers larger than a single chunk (512 bytes)", async () => {
    const bytes = new Uint8Array(1024).map((_, i) => i % 256);
    const blob = base64ToBlob(toBase64(bytes), "application/octet-stream");
    expect(blob.size).toBe(1024);
    expect(new Uint8Array(await blob.arrayBuffer())).toEqual(bytes);
  });
});
