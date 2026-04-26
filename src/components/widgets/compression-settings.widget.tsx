"use client";

import { useCompressorStore } from "@/lib/store/compressor-store";
import { formatBytes } from "@/lib/utils/format-bytes";
import { Button, Card } from "@/components/ui";

export function CompressionSettings() {
  const { file, preview, settings, setFile, setPreview, setCompressed } = useCompressorStore();

  if (!file) return null;

  const handleRemove = () => {
    setFile(null);
    setPreview("");
    setCompressed(null);
  };

  return (
    <Card className="space-y-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="font-medium text-zinc-900">{file.name}</p>
          <p className="text-sm text-zinc-500">{formatBytes(file.size)}</p>
        </div>
        <Button variant="danger" onClick={handleRemove}>
          Remover
        </Button>
      </div>
    </Card>
  );
}