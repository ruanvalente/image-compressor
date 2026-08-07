"use client";

import { useCompressorStore } from "@/lib/store/compressor-store";
import { formatBytes } from "@/lib/utils/format-bytes";
import { Button, ImageIcon, XIcon } from "@/components/ui";

export function CompressionSettings({ onRemove }: { onRemove?: () => void }) {
  const file = useCompressorStore((s) => s.file);
  const setFile = useCompressorStore((s) => s.setFile);
  const setPreview = useCompressorStore((s) => s.setPreview);
  const setCompressed = useCompressorStore((s) => s.setCompressed);

  if (!file) return null;

  const handleRemove = () => {
    onRemove?.();
    setFile(null);
    setPreview("");
    setCompressed(null);
  };

  return (
    <div className="flex items-center justify-between gap-4 border-b border-border pb-5">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-muted text-primary">
          <ImageIcon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-text">{file.name}</p>
          <p className="text-sm text-text-muted">{formatBytes(file.size)}</p>
        </div>
      </div>
      <Button variant="danger" onClick={handleRemove} size="sm">
        <XIcon className="h-4 w-4" />
        Remover
      </Button>
    </div>
  );
}
