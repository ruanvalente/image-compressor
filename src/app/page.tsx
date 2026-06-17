"use client";

import { useCallback, useState } from "react";
import { useCompressorStore } from "@/lib/store/compressor-store";
import { usePdfStore } from "@/lib/store/pdf-store";
import { useImageCompression, usePdfGeneration } from "@/hooks";
import {
  FileDropzone,
  FormatSelector,
  QualityControl,
  CompressionSettings,
  ImagePreview,
  CompressionResultCard,
  PdfGenerator,
  PdfDownloadCard,
} from "@/components/widgets";
import { Button } from "@/components/ui";

type Mode = "compress" | "pdf";

function ModeToggle({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  return (
    <div
      role="tablist"
      aria-label="Selecione a ferramenta"
      className="mb-6 flex overflow-hidden rounded-lg border border-zinc-300"
    >
      <button
        role="tab"
        aria-selected={mode === "compress"}
        onClick={() => onChange("compress")}
        className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 ${
          mode === "compress"
            ? "bg-blue-600 text-white"
            : "bg-white text-zinc-700 hover:bg-zinc-100"
        }`}
      >
        Compressor
      </button>
      <button
        role="tab"
        aria-selected={mode === "pdf"}
        onClick={() => onChange("pdf")}
        className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 ${
          mode === "pdf"
            ? "bg-blue-600 text-white"
            : "bg-white text-zinc-700 hover:bg-zinc-100"
        }`}
      >
        PDF
      </button>
    </div>
  );
}

function CompressMode() {
  const { file, compressed, loading } = useCompressorStore();
  const { compress, download } = useImageCompression();

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-4">
        <FileDropzone />
        <CompressionSettings />
        <QualityControl />
        <FormatSelector />

        <Button
          onClick={compress}
          disabled={loading || !file}
          className="w-full"
        >
          {loading ? "Comprimindo..." : "Comprimir Imagem"}
        </Button>
      </div>

      <div className="space-y-4">
        {compressed ? (
          <>
            <ImagePreview
              src={`data:image/${compressed.format};base64,${compressed.data}`}
              alt="Comprimida"
            />
            <CompressionResultCard
              result={compressed}
              onDownload={download}
            />
          </>
        ) : (
          <ImagePreview src="" alt="Resultado" />
        )}
      </div>
    </div>
  );
}

function PdfMode() {
  const { result } = usePdfStore();
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

export default function Home() {
  const [mode, setMode] = useState<Mode>("compress");

  const handleModeChange = useCallback((newMode: Mode) => {
    if (newMode !== "compress") {
      useCompressorStore.getState().reset();
    }
    if (newMode !== "pdf") {
      usePdfStore.getState().reset();
    }
    setMode(newMode);
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <ModeToggle mode={mode} onChange={handleModeChange} />
      {mode === "compress" ? <CompressMode /> : <PdfMode />}
    </div>
  );
}
