"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { usePdfStore } from "@/lib/store/pdf-store";
import { usePdfGeneration } from "@/hooks";
import {
  Button,
  Card,
  RadioGroup,
  EmptyState,
  DocumentIcon,
  CheckIcon,
  SpinnerIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  XIcon,
} from "@/components/ui";
import { FileDropzone } from "./file-dropzone.widget";
import { PdfDownloadCard } from "./pdf-download-card.widget";
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
  const result = usePdfStore((s) => s.result);
  const removeFile = usePdfStore((s) => s.removeFile);
  const moveFile = usePdfStore((s) => s.moveFile);
  const setPageSize = usePdfStore((s) => s.setPageSize);
  const reset = usePdfStore((s) => s.reset);
  const { generate, download, isLoading } = usePdfGeneration();
  const [actionState, setActionState] = useState<"idle" | "success">("idle");
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (successTimer.current) clearTimeout(successTimer.current);
    },
    [],
  );

  const handleGenerate = useCallback(async () => {
    setActionState("idle");
    const ok = await generate();
    if (ok) {
      setActionState("success");
      if (successTimer.current) clearTimeout(successTimer.current);
      successTimer.current = setTimeout(() => setActionState("idle"), 2500);
    }
  }, [generate]);

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
    <div className="space-y-6">
      <h2 className="sr-only">Ferramenta de geração de PDF</h2>
      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <FileDropzone multiple onFiles={handleFiles} />
        <section aria-label="Resultado do PDF" className="space-y-6">
          {result ? (
            <PdfDownloadCard result={result} onDownload={download} />
          ) : (
            <EmptyState
              icon={<DocumentIcon className="h-6 w-6" />}
              title="O PDF gerado aparecerá aqui"
              description="Adicione imagens e gere o PDF para ver o resultado."
            />
          )}
        </section>
      </div>

      {files.length > 0 && (
        <>
          <Card className="space-y-5">
            <RadioGroup
              name="page-size"
              legend="Tamanho da página"
              options={PAGE_SIZE_OPTIONS}
              value={pageSize}
              onChange={setPageSize}
              disabled={isLoading}
            />

            <div className="border-t border-border pt-5">
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                <p className="text-sm font-medium text-text">
                  {files.length} {files.length === 1 ? "imagem" : "imagens"}{" "}
                  selecionada{files.length !== 1 ? "s" : ""}{" "}
                  <span className="text-text-muted">
                    ({formatBytes(totalSize)})
                  </span>
                </p>
                <Button variant="ghost" size="sm" onClick={reset}>
                  Limpar todas
                </Button>
              </div>

              <ul
                className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3"
                role="list"
                aria-label="Imagens selecionadas para o PDF"
              >
                {files.map((file, index) => (
                  <li
                    key={`${file.name}-${index}`}
                    className="group relative overflow-hidden rounded-lg border border-border bg-surface-muted"
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
                      <p className="truncate text-xs font-medium text-text">
                        {file.name}
                      </p>
                      <p className="text-xs text-text-muted">
                        {formatBytes(file.size)}
                      </p>
                    </div>

                    <div className="absolute right-1 top-1 flex gap-0.5 focus-within:opacity-100 lg:opacity-0 lg:group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        className="flex h-7 w-7 items-center justify-center rounded bg-black/50 text-white transition-colors hover:bg-black/70 disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                        aria-label={`Mover ${file.name} para cima`}
                      >
                        <ChevronUpIcon className="h-3.5 w-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleMoveDown(index)}
                        disabled={index === files.length - 1}
                        className="flex h-7 w-7 items-center justify-center rounded bg-black/50 text-white transition-colors hover:bg-black/70 disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                        aria-label={`Mover ${file.name} para baixo`}
                      >
                        <ChevronDownIcon className="h-3.5 w-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="flex h-7 w-7 items-center justify-center rounded bg-black/50 text-white transition-colors hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                        aria-label={`Remover ${file.name}`}
                      >
                        <XIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <span className="absolute left-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      <span className="sr-only">{`Ordem ${index + 1}`}</span>
                      <span aria-hidden="true">{index + 1}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>

          <Button
            onClick={handleGenerate}
            disabled={isLoading}
            size="lg"
            className="w-full"
            aria-busy={isLoading}
            variant={actionState === "success" ? "success" : "primary"}
          >
            {isLoading ? (
              <>
                <SpinnerIcon className="h-4 w-4" />
                Gerando PDF...
              </>
            ) : actionState === "success" ? (
              <>
                <CheckIcon className="h-4 w-4" />
                PDF Gerado
              </>
            ) : (
              "Gerar PDF"
            )}
          </Button>
        </>
      )}
    </div>
  );
}
