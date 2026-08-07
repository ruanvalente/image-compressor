"use client";

import { useCallback, useId, useRef, type ChangeEvent, type KeyboardEvent } from "react";
import Image from "next/image";
import { useFileDropzone } from "@/hooks/use-file-dropzone";
import { UploadIcon, XIcon } from "@/components/ui";

interface FileDropzoneProps {
  multiple?: boolean;
  preview?: string;
  accept?: string;
  error?: string | null;
  onFiles: (files: File[]) => void;
}

export function FileDropzone({
  multiple = false,
  preview = "",
  accept = "image/*",
  error = null,
  onFiles,
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hintId = useId();
  const errorId = useId();
  const inputId = useId();
  const { dragActive, handleDragEnter, handleDragOver, handleDragLeave, handleDrop } =
    useFileDropzone(onFiles);

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      if (files.length > 0) onFiles(files);
      e.target.value = "";
    },
    [onFiles],
  );

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      inputRef.current?.click();
    }
  }, []);

  const label = multiple
    ? "Área para enviar imagens. Arraste imagens aqui ou clique para selecionar."
    : "Área para enviar imagem. Arraste uma imagem aqui ou clique para selecionar.";

  const hint = multiple ? "Arraste imagens aqui" : "Arraste uma imagem aqui";

  const subHint = "ou clique para selecionar";

  const formats = multiple ? "JPEG • PNG • WebP • AVIF" : "JPG • PNG • WEBP • AVIF";

  const containerState = error
    ? "border-error bg-error-muted"
    : dragActive
      ? "border-primary bg-primary-muted"
      : "border-border-strong bg-surface hover:border-primary hover:bg-primary-muted";

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={label}
      aria-describedby={error ? `${hintId} ${errorId}` : hintId}
      className={`group relative flex h-56 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 sm:h-64 ${containerState}`}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      onKeyDown={handleKeyDown}
    >
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={handleInputChange}
        aria-hidden="true"
      />
      <span id={hintId} className="sr-only">
        {hint}
      </span>
      {error ? (
        <div className="px-6 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-error-muted text-error">
            <XIcon className="h-6 w-6" />
          </span>
          <p id={errorId} role="alert" className="mt-3 text-sm font-medium text-error">
            {error}
          </p>
          <p className="mt-0.5 text-xs text-text-muted">{subHint}</p>
        </div>
      ) : !multiple && preview ? (
        <>
          <Image
            src={preview}
            alt="Prévia da imagem selecionada"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-contain p-4"
          />
          <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-black/60 py-2 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            <UploadIcon className="h-3.5 w-3.5" />
            Trocar imagem
          </span>
        </>
      ) : (
        <div className="px-6 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-muted text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            <UploadIcon className="h-6 w-6" />
          </span>
          <p className="mt-3 text-sm font-medium text-text">{hint}</p>
          <p className="mt-0.5 text-sm text-text-muted">{subHint}</p>
          <p className="mt-3 text-[11px] font-medium uppercase tracking-wider text-text-subtle">
            {formats}
          </p>
        </div>
      )}
    </div>
  );
}
