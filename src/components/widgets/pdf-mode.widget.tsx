"use client";

import { usePdfStore } from "@/lib/store/pdf-store";
import { usePdfGeneration } from "@/hooks";
import { PdfGenerator } from "./pdf-generator.widget";
import { PdfDownloadCard } from "./pdf-download-card.widget";

export function PdfMode() {
  const result = usePdfStore((s) => s.result);
  const { download } = usePdfGeneration();

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-4">
        <PdfGenerator />
      </div>

      <div className="space-y-4">
        {result ? (
          <PdfDownloadCard result={result} onDownload={download} />
        ) : (
          <div className="flex h-64 items-center justify-center rounded-xl border-2 border-dashed border-zinc-200 bg-white">
            <p className="text-center text-zinc-500">
              <span className="block text-3xl" aria-hidden="true">📄</span>
              <span className="mt-2 block text-sm">
                O PDF gerado aparecerá aqui
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
