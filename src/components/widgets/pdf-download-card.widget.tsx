"use client";

import { Badge, Button, Card, DocumentIcon, DownloadIcon } from "@/components/ui";
import { formatBytes } from "@/lib/utils/format-bytes";
import type { PdfResult } from "@/lib/types";

interface PdfDownloadCardProps {
  result: PdfResult;
  onDownload: () => void;
}

export function PdfDownloadCard({ result, onDownload }: PdfDownloadCardProps) {
  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="flex min-w-0 items-center gap-2 text-sm font-medium text-text">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-error-muted text-error">
            <DocumentIcon className="h-4 w-4" />
          </span>
          <span className="truncate">{result.filename}</span>
        </p>
        <Badge variant="info">PDF</Badge>
      </div>

      <dl className="grid grid-cols-2 gap-4 text-center">
        <div>
          <dt className="text-xs font-medium text-text-muted">Páginas</dt>
          <dd className="mt-0.5 font-semibold text-text">{result.pageCount}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-text-muted">Tamanho</dt>
          <dd className="mt-0.5 font-semibold text-success-strong">
            {formatBytes(result.size)}
          </dd>
        </div>
      </dl>

      <Button variant="success" onClick={onDownload} className="w-full" size="lg">
        <DownloadIcon className="h-4 w-4" />
        Baixar PDF
      </Button>
    </Card>
  );
}
