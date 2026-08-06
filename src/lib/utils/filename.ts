export function sanitizeFilename(filename: string, extension?: string): string {
  const withoutExt = filename.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/\.[^.]+$/, "").slice(0, 255);
  return extension ? `${withoutExt}.${extension}` : withoutExt;
}
