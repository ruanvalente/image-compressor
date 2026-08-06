"use client";

import { useCallback } from "react";
import { usePdfStore, type PdfResult } from "@/lib/store/pdf-store";
import { toast } from "@/lib/utils/toast";
import { base64ToBlob } from "@/lib/utils/base64";

export function usePdfGeneration() {
  const generate = useCallback(async () => {
    const store = usePdfStore.getState();
    if (store.files.length === 0) {
      toast.warning("Nenhuma imagem selecionada", {
        description: "Adicione pelo menos uma imagem para gerar o PDF",
      });
      return;
    }

    store.setLoading(true);
    try {
      const formData = new FormData();
      store.files.forEach((f) => formData.append("files", f));
      formData.append("filename", "imagens.pdf");
      formData.append("pageSize", store.pageSize);

      const res = await fetch("/api/pdf", {
        method: "POST",
        body: formData,
      });
      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!res.ok) {
        throw new Error(data?.error ?? `Falha ao gerar PDF (HTTP ${res.status})`);
      }

      usePdfStore.getState().setResult(data as PdfResult);
      toast.success("PDF gerado com sucesso!");
    } catch (e) {
      if (e instanceof TypeError) {
        toast.error("Falha de conexão", {
          description: "Verifique sua internet e tente novamente",
        });
      } else {
        toast.error(e instanceof Error ? e.message : "Falha ao gerar PDF");
      }
    } finally {
      usePdfStore.getState().setLoading(false);
    }
  }, []);

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
