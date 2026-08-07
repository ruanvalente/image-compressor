"use client";

import { useCallback } from "react";
import Image from "next/image";
import { usePdfStore } from "@/lib/store/pdf-store";
import { usePdfGeneration } from "@/hooks";
import { Button, Card, RadioGroup } from "@/components/ui";
import { FileDropzone } from "./file-dropzone.widget";
import { formatBytes } from "@/lib/utils/format-bytes";
import { toast } from "@/lib/utils/toast";
import {
  PAGE_SIZE_OPTIONS,
  PDF_MAX_FILES,
  PDF_MAX_FILE_SIZE,
  PDF_MAX_TOTAL_SIZE,
} from "@/lib/constants";

export function PdfGenerator() {
  const files = usePdfStore((s) => s.files);
  const previews = usePdfStore((s) => s.previews);
  const pageSize = usePdfStore((s) => s.pageSize);
  const removeFile = usePdfStore((s) => s.removeFile);
  const moveFile = usePdfStore((s) => s.moveFile);
  const setPageSize = usePdfStore((s) => s.setPageSize);
  const reset = usePdfStore((s) => s.reset);
  const { generate, isLoading } = usePdfGeneration();

  const handleFiles = useCallback((newFiles: File[]) => {
    const store = usePdfStore.getState();
    const currentTotal = store.files.reduce((acc, f) => acc + f.size, 0);

    const oversized = newFiles.filter((f) => f.size > PDF_MAX_FILE_SIZE);
    for (const f of oversized) {
      toast.error("Arquivo muito grande", {
        description: `${f.name} excede o limite de ${PDF_MAX_FILE_SIZE / 1024 / 1024}MB`,
      });
    }

    const invalidType = newFiles.filter((f) => !f.type.startsWith("image/"));
    for (const f of invalidType) {
      toast.error("Tipo de arquivo inválido", {
        description: `${f.name} não é uma imagem válida`,
      });
    }

    const validFiles = newFiles.filter(
      (f) => f.size <= PDF_MAX_FILE_SIZE && f.type.startsWith("image/"),
    );

    if (store.files.length + validFiles.length > PDF_MAX_FILES) {
      toast.error(`Máximo de ${PDF_MAX_FILES} imagens`, {
        description: `Remova algumas imagens antes de adicionar mais`,
      });
      return;
    }

    const newTotal =
      currentTotal + validFiles.reduce((acc, f) => acc + f.size, 0);
    if (newTotal > PDF_MAX_TOTAL_SIZE) {
      toast.error(`Limite de ${PDF_MAX_TOTAL_SIZE / 1024 / 1024}MB excedido`, {
        description: `Adicione arquivos menores ou remova alguns existentes`,
      });
      return;
    }

    if (validFiles.length > 0) {
      store.addFiles(validFiles);
      toast.success(`${validFiles.length} imagem(ns) adicionada(s)`);
    }
  }, []);

  const handleMoveUp = useCallback(
    (index: number) => {
      if (index > 0) moveFile(index, index - 1);
    },
    [moveFile],
  );

  const handleMoveDown = useCallback(
    (index: number) => {
      if (index < files.length - 1) moveFile(index, index + 1);
    },
    [moveFile, files.length],
  );

  const totalSize = files.reduce((acc, f) => acc + f.size, 0);

  return (
    <div className="space-y-4">
      <FileDropzone multiple onFiles={handleFiles} />

      {files.length > 0 && (
        <>
          <RadioGroup
            name="page-size"
            legend="Tamanho da página"
            options={PAGE_SIZE_OPTIONS}
            value={pageSize}
            onChange={setPageSize}
          />

          <Card className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-zinc-800">
                {files.length} {files.length === 1 ? "imagem" : "imagens"}{" "}
                selecionada{files.length !== 1 ? "s" : ""}{" "}
                <span className="text-zinc-500">
                  ({formatBytes(totalSize)})
                </span>
              </p>
              <Button variant="ghost" size="sm" onClick={reset}>
                Limpar todas
              </Button>
            </div>

            <ul
              className="grid grid-cols-2 gap-3 sm:grid-cols-3"
              role="list"
              aria-label="Imagens selecionadas para o PDF"
            >
              {files.map((file, index) => (
                <li
                  key={`${file.name}-${index}`}
                  className="group relative overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50"
                >
                  <div className="relative aspect-square">
                    {previews[index] && (
                      <Image
                        src={previews[index]}
                        alt={file.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 50vw, 33vw"
                      />
                    )}
                  </div>

                  <div className="p-2">
                    <p className="truncate text-xs font-medium text-zinc-800">
                      {file.name}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {formatBytes(file.size)}
                    </p>
                  </div>

                  <div className="absolute right-1 top-1 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                    <button
                      type="button"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className="flex h-6 w-6 items-center justify-center rounded bg-black/50 text-white disabled:opacity-30 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      aria-label={`Mover ${file.name} para cima`}
                    >
                      <svg
                        className="h-3 w-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 15l7-7 7 7"
                        />
                      </svg>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === files.length - 1}
                      className="flex h-6 w-6 items-center justify-center rounded bg-black/50 text-white disabled:opacity-30 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      aria-label={`Mover ${file.name} para baixo`}
                    >
                      <svg
                        className="h-3 w-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="flex h-6 w-6 items-center justify-center rounded bg-black/50 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      aria-label={`Remover ${file.name}`}
                    >
                      <svg
                        className="h-3 w-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>

                  <span className="absolute left-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                    <span className="sr-only">{`Ordem ${index + 1}`}</span>
                    <span aria-hidden="true">{index + 1}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          <Button
            onClick={generate}
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? "Gerando PDF..." : "Gerar PDF"}
          </Button>
        </>
      )}
    </div>
  );
}
