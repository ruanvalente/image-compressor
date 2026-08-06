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
import { toast } from "@/lib/utils/toast";
import { MAX_COMPRESS_FILE_SIZE } from "@/lib/constants";

type Mode = "compress" | "pdf";

function ModeToggle({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  return (
    <div
      role="tablist"
      aria-label="Selecione a ferramenta"
      className="mb-6 flex overflow-hidden rounded-lg border border-zinc-300"
    >
      <button
        type="button"
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
        type="button"
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
  const file = useCompressorStore((s) => s.file);
  const preview = useCompressorStore((s) => s.preview);
  const compressed = useCompressorStore((s) => s.compressed);
  const loading = useCompressorStore((s) => s.loading);
  const { compress, download } = useImageCompression();

  const handleFiles = useCallback((files: File[]) => {
    const selected = files[0];
    if (!selected) return;

    if (!selected.type.startsWith("image/")) {
      toast.error("Tipo de arquivo inválido", {
        description:
          "Por favor, envie apenas imagens (JPEG, PNG, WebP, etc.)",
      });
      return;
    }

    if (selected.size > MAX_COMPRESS_FILE_SIZE) {
      toast.error("Arquivo muito grande", {
        description: `Limite de ${MAX_COMPRESS_FILE_SIZE / 1024 / 1024}MB para compressão`,
      });
      return;
    }

    useCompressorStore.getState().setFile(selected);
    useCompressorStore.getState().setCompressed(null);

    const reader = new FileReader();
    reader.onload = () =>
      useCompressorStore.getState().setPreview(reader.result as string);
    reader.readAsDataURL(selected);

    toast.success("Imagem carregada", {
      description: selected.name,
    });
  }, []);

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-4">
        <FileDropzone preview={preview} onFiles={handleFiles} />
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
