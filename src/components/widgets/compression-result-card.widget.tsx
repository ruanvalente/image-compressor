"use client";

import { formatBytes } from "@/lib/utils/format-bytes";
import { Badge, Button, Card, DownloadIcon } from "@/components/ui";
import type { CompressionResult } from "@/lib/types";

interface CompressionResultCardProps {
  result: CompressionResult;
  onDownload: () => void;
}

export function CompressionResultCard({ result, onDownload }: CompressionResultCardProps) {
  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-text">Resultado da compressão</p>
        <Badge variant="info" className="uppercase">
          {result.format}
        </Badge>
      </div>

      <dl className="grid grid-cols-3 gap-4 text-center">
        <div>
          <dt className="text-xs font-medium text-text-muted">Original</dt>
          <dd className="mt-0.5 font-semibold text-text">
            {formatBytes(result.originalSize)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-text-muted">Comprimida</dt>
          <dd className="mt-0.5 font-semibold text-success-strong">
            {formatBytes(result.compressedSize)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-text-muted">Redução</dt>
          <dd className="mt-0.5">
            <Badge variant="success">{result.compressionRatio}%</Badge>
          </dd>
        </div>
      </dl>

      <Button variant="success" onClick={onDownload} className="w-full" size="lg">
        <DownloadIcon className="h-4 w-4" />
        Baixar Imagem
      </Button>
    </Card>
  );
}
