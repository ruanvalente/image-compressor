"use client";

import { useCallback } from "react";
import { usePdfStore, type PdfResult } from "@/lib/store/pdf-store";
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

export function usePdfGeneration() {
  const { files, pageSize, setResult, setLoading } = usePdfStore();

  const generate = useCallback(async () => {
    if (files.length === 0) {
      toast.warning("Nenhuma imagem selecionada", {
        description: "Adicione pelo menos uma imagem para gerar o PDF",
      });
      return;
    }

    setLoading(true);

    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));
    formData.append("filename", "imagens.pdf");
    formData.append("pageSize", pageSize);

    toast.promise(
      (async () => {
        const res = await fetch("/api/pdf", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erro ao gerar PDF");
        setResult(data as PdfResult);
      })(),
      {
        loading: "Gerando PDF...",
        success: "PDF gerado com sucesso!",
        error: "Falha ao gerar PDF",
      },
    );
  }, [files, pageSize, setResult, setLoading]);

  const download = useCallback(() => {
    const { result } = usePdfStore.getState();
    if (!result) return;

    const blob = base64ToBlob(result.data, "application/pdf");
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = result.filename;
    link.click();

    URL.revokeObjectURL(url);

    toast.success("Download iniciado", {
      description: result.filename,
    });
  }, []);

  return {
    generate,
    download,
    isLoading: usePdfStore((s) => s.loading),
  };
}
