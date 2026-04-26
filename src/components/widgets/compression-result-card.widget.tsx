"use client";

import { formatBytes } from "@/lib/utils/format-bytes";
import { Badge, Button, Card } from "@/components/ui";
import type { CompressionResult } from "@/lib/store/compressor-store";

interface CompressionResultCardProps {
  result: CompressionResult;
  onDownload: () => void;
}

export function CompressionResultCard({ result, onDownload }: CompressionResultCardProps) {
  return (
    <Card className="space-y-4">
      <div className="mb-4 grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-xs text-zinc-500">Original</p>
          <p className="font-semibold text-zinc-900">{formatBytes(result.originalSize)}</p>
        </div>
        <div>
          <p className="text-xs text-zinc-500">Comprimida</p>
          <p className="font-semibold text-green-600">{formatBytes(result.compressedSize)}</p>
        </div>
        <div>
          <p className="text-xs text-zinc-500">Redução</p>
          <Badge variant="info">{result.compressionRatio}%</Badge>
        </div>
      </div>

      <Button variant="success" onClick={onDownload} className="w-full">
        Baixar Imagem
      </Button>
    </Card>
  );
}