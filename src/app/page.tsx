"use client";

import { useCompressorStore } from "@/lib/store/compressor-store";
import { useImageCompression } from "@/hooks";
import {
  FileDropzone,
  FormatSelector,
  QualityControl,
  CompressionSettings,
  ImagePreview,
  CompressionResultCard,
} from "@/components/widgets";
import { Button } from "@/components/ui";

export default function Home() {
  const { file, compressed, loading } = useCompressorStore();
  const { compress, download } = useImageCompression();

  return (
    <div className="min-h-screen bg-zinc-50 font-sans">
      <header className="border-b border-zinc-200 bg-white py-4">
        <div className="mx-auto max-w-4xl px-4">
          <h1 className="text-xl font-bold text-zinc-900">
            🖼️ Image Compressor
          </h1>
          <p className="text-sm text-zinc-500">
            Comprimir imagens mantendo a melhor qualidade
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
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
                  alt="Compressed"
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
      </main>
    </div>
  );
}
