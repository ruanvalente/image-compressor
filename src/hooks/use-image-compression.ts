"use client";

import { useCallback } from "react";
import {
  useCompressorStore,
  type CompressionResult,
} from "@/lib/store/compressor-store";
import { toast } from "@/lib/utils/toast";

function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteChars = atob(base64);
  const chunks: BlobPart[] = [];

  for (let offset = 0; offset < byteChars.length; offset += 512) {
    const slice = byteChars.slice(offset, offset + 512);
    const byteNumbers = new Array<number>(slice.length);

    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    chunks.push(new Uint8Array(byteNumbers));
  }

  return new Blob(chunks, { type: mimeType });
}

export function useImageCompression() {
  const { file, settings, setCompressed, setLoading } = useCompressorStore();

  const compress = useCallback(async () => {
    if (!file) {
      toast.warning("Nenhum arquivo selecionado", {
        description: "Selecione uma imagem para comprimir",
      });
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("quality", settings.quality.toString());
    formData.append("format", settings.format);

    toast.promise(
      (async () => {
        const res = await fetch("/api/compress", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erro ao comprimir");
        setCompressed(data as CompressionResult);
      })(),
      {
        loading: "Comprimindo imagem...",
        success: "Imagem comprimida com sucesso!",
        error: "Falha ao comprimir imagem",
      },
    );
  }, [file, settings, setCompressed, setLoading]);

  const download = useCallback(() => {
    const { compressed } = useCompressorStore.getState();
    if (!compressed) return;

    const mimeType =
      compressed.format === "jpeg"
        ? "image/jpeg"
        : compressed.format === "png"
          ? "image/png"
          : compressed.format === "webp"
            ? "image/webp"
            : "image/avif";

    const blob = base64ToBlob(compressed.data, mimeType);
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = compressed.filename;
    link.click();

    URL.revokeObjectURL(url);

    toast.success("Download iniciado", {
      description: `${compressed.filename} está sendo baixado`,
    });
  }, []);

  return {
    compress,
    download,
    isLoading: useCompressorStore((s) => s.loading),
  };
}
