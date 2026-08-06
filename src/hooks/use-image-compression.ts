"use client";

import { useCallback } from "react";
import {
  useCompressorStore,
  type CompressionResult,
} from "@/lib/store/compressor-store";
import { toast } from "@/lib/utils/toast";
import { base64ToBlob } from "@/lib/utils/base64";

const MIME_TYPES: Record<string, string> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
};

export function useImageCompression() {
  const compress = useCallback(async () => {
    const store = useCompressorStore.getState();
    if (!store.file) {
      toast.warning("Nenhum arquivo selecionado", {
        description: "Selecione uma imagem para comprimir",
      });
      return;
    }

    store.setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", store.file);
      formData.append("quality", store.settings.quality.toString());
      formData.append("format", store.settings.format);

      const res = await fetch("/api/compress", {
        method: "POST",
        body: formData,
      });
      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!res.ok) {
        throw new Error(
          data?.error ?? `Falha ao comprimir imagem (HTTP ${res.status})`,
        );
      }

      useCompressorStore.getState().setCompressed(data as CompressionResult);
      toast.success("Imagem comprimida com sucesso!");
    } catch (e) {
      if (e instanceof TypeError) {
        toast.error("Falha de conexão", {
          description: "Verifique sua internet e tente novamente",
        });
      } else {
        toast.error(
          e instanceof Error ? e.message : "Falha ao comprimir imagem",
        );
      }
    } finally {
      useCompressorStore.getState().setLoading(false);
    }
  }, []);

  const download = useCallback(() => {
    const { compressed } = useCompressorStore.getState();
    if (!compressed) return;

    const mimeType = MIME_TYPES[compressed.format] ?? "application/octet-stream";
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
