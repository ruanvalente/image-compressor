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
          <p className="text-xs font-medium text-zinc-600">Original</p>
          <p className="font-semibold text-zinc-900">{formatBytes(result.originalSize)}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-zinc-600">Comprimida</p>
          <p className="font-semibold text-green-700">{formatBytes(result.compressedSize)}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-zinc-600">Redução</p>
          <Badge variant="info">{result.compressionRatio}%</Badge>
        </div>
      </div>

      <Button variant="success" onClick={onDownload} className="w-full">
        Baixar Imagem
      </Button>
    </Card>
  );
}