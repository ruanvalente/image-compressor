"use client";

import { useCallback, useId, useRef, type ChangeEvent, type KeyboardEvent } from "react";
import Image from "next/image";
import { useFileDropzone } from "@/hooks/use-file-dropzone";

interface FileDropzoneProps {
  multiple?: boolean;
  preview?: string;
  accept?: string;
  onFiles: (files: File[]) => void;
}

export function FileDropzone({
  multiple = false,
  preview = "",
  accept = "image/*",
  onFiles,
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hintId = useId();
  const inputId = useId();
  const { dragActive, handleDragOver, handleDragLeave, handleDrop } =
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

  const subHint = multiple
    ? "ou clique para selecionar (JPEG, PNG, WebP, AVIF)"
    : "ou clique para selecionar";

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={label}
      aria-describedby={hintId}
      className={`relative flex h-64 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
        dragActive ? "border-blue-500 bg-blue-50" : "border-zinc-300 bg-white"
      } ${!preview || multiple ? "hover:border-zinc-400" : ""}`}
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
      {!multiple && preview ? (
        <Image
          src={preview}
          alt="Prévia da imagem selecionada"
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-contain p-4"
        />
      ) : (
        <div className="text-center text-zinc-500">
          <p className="text-3xl" aria-hidden="true">
            📁
          </p>
          <p className="mt-2 text-sm text-zinc-600">{hint}</p>
          <p className="text-xs text-zinc-500">{subHint}</p>
        </div>
      )}
    </div>
  );
}
