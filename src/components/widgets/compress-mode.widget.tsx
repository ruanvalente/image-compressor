"use client";

import { useCallback } from "react";
import { useCompressorStore } from "@/lib/store/compressor-store";
import { useImageCompression } from "@/hooks";
import { Button } from "@/components/ui";
import { toast } from "@/lib/utils/toast";
import { MAX_COMPRESS_FILE_SIZE } from "@/lib/constants";
import { FileDropzone } from "./file-dropzone.widget";
import { FormatSelector } from "./format-selector.widget";
import { QualityControl } from "./quality-control.widget";
import { CompressionSettings } from "./compression-settings.widget";
import { ImagePreview } from "./image-preview.widget";
import { CompressionResultCard } from "./compression-result-card.widget";

export function CompressMode() {
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
