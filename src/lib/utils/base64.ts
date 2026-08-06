export function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteChars = atob(base64);
  const chunks: BlobPart[] = [];

  for (let offset = 0; offset < byteChars.length; offset += 512) {
    const slice = byteChars.slice(offset, offset + 512);
    const byteNumbers = new Array<number>(slice.length);

    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    chunks.push(new Uint8Array(byteNumbers));
  }

  return new Blob(chunks, { type: mimeType });
}
