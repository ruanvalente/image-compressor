"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useCompressorStore } from "@/lib/store/compressor-store";
import { useImageCompression } from "@/hooks";
import { Button, Card, CheckIcon, SpinnerIcon } from "@/components/ui";
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
  const [dropzoneError, setDropzoneError] = useState<string | null>(null);
  const [actionState, setActionState] = useState<"idle" | "success">("idle");
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (successTimer.current) clearTimeout(successTimer.current);
    },
    [],
  );

  const handleCompress = useCallback(async () => {
    setActionState("idle");
    if (successTimer.current) {
      clearTimeout(successTimer.current);
      successTimer.current = null;
    }
    const ok = await compress();
    if (ok) {
      setActionState("success");
      successTimer.current = setTimeout(() => setActionState("idle"), 2500);
    }
  }, [compress]);

  const handleFiles = useCallback((files: File[]) => {
    const selected = files[0];
    if (!selected) return;

    if (!selected.type.startsWith("image/")) {
      setDropzoneError(
        "Formato não suportado — envie apenas imagens (JPG, PNG, WebP, AVIF).",
      );
      toast.error("Tipo de arquivo inválido", {
        description:
          "Por favor, envie apenas imagens (JPEG, PNG, WebP, etc.)",
      });
      return;
    }

    if (selected.size > MAX_COMPRESS_FILE_SIZE) {
      setDropzoneError(
        `Arquivo muito grande — limite de ${MAX_COMPRESS_FILE_SIZE / 1024 / 1024}MB para compressão.`,
      );
      toast.error("Arquivo muito grande", {
        description: `Limite de ${MAX_COMPRESS_FILE_SIZE / 1024 / 1024}MB para compressão`,
      });
      return;
    }

    setDropzoneError(null);
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
    <div className="space-y-6">
      <h2 className="sr-only">Ferramenta de compressão de imagens</h2>
      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <FileDropzone
          preview={preview}
          error={dropzoneError}
          onFiles={handleFiles}
        />
        <section aria-label="Resultado da compressão" className="space-y-6">
          {compressed ? (
            <>
              <ImagePreview
                src={`data:image/${compressed.format};base64,${compressed.data}`}
                alt="Imagem comprimida"
              />
              <CompressionResultCard result={compressed} onDownload={download} />
            </>
          ) : (
            <ImagePreview src="" alt="Resultado" />
          )}
        </section>
      </div>

      <Card className="space-y-5">
        <CompressionSettings onRemove={() => setDropzoneError(null)} />
        <QualityControl />
        <FormatSelector />
      </Card>

      <Button
        onClick={handleCompress}
        disabled={loading || !file}
        size="lg"
        className="w-full"
        aria-busy={loading}
        variant={actionState === "success" ? "success" : "primary"}
      >
        {loading ? (
          <>
            <SpinnerIcon className="h-4 w-4" />
            Comprimindo...
          </>
        ) : actionState === "success" ? (
          <>
            <CheckIcon className="h-4 w-4" />
            Imagem Comprimida
          </>
        ) : (
          "Comprimir Imagem"
        )}
      </Button>
    </div>
  );
}
