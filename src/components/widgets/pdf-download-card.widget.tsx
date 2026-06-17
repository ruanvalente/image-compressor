"use client";

import { Badge, Button, Card } from "@/components/ui";
import { formatBytes } from "@/lib/utils/format-bytes";
import type { PdfResult } from "@/lib/store/pdf-store";

interface PdfDownloadCardProps {
  result: PdfResult;
  onDownload: () => void;
}

export function PdfDownloadCard({ result, onDownload }: PdfDownloadCardProps) {
  return (
    <Card className="space-y-4">
      <div className="mb-4 grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-xs font-medium text-zinc-600">Páginas</p>
          <p className="font-semibold text-zinc-900">{result.pageCount}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-zinc-600">Tamanho</p>
          <p className="font-semibold text-green-700">
            {formatBytes(result.size)}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-zinc-600">Arquivo</p>
          <Badge variant="info" className="truncate max-w-full">
            {result.filename}
          </Badge>
        </div>
      </div>

      <Button variant="success" onClick={onDownload} className="w-full">
        Baixar PDF
      </Button>
    </Card>
  );
}
