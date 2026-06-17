"use client";

import { useCallback, useRef, useId, DragEvent, ChangeEvent } from "react";
import Image from "next/image";
import { useCompressorStore } from "@/lib/store/compressor-store";
import { toast } from "@/lib/utils/toast";

interface FileDropzoneProps {
  multiple?: boolean;
  onFiles?: (files: File[]) => void;
}

export function FileDropzone({ multiple = false, onFiles }: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hintId = useId();
  const {
    preview,
    dragActive,
    setDragActive,
    setFile,
    setPreview,
    setCompressed,
  } = useCompressorStore();

  const handleFiles = useCallback(
    (f: File[]) => {
      if (multiple && onFiles) {
        const images = f.filter((file) => {
          if (!file.type.startsWith("image/")) {
            toast.error("Tipo de arquivo inválido", {
              description: `${file.name} não é uma imagem válida`,
            });
            return false;
          }
          return true;
        });
        if (images.length > 0) {
          onFiles(images);
          toast.success(`${images.length} imagem(ns) adicionada(s)`);
        }
        return;
      }

      const file = f[0];
      if (!file?.type.startsWith("image/")) {
        toast.error("Tipo de arquivo inválido", {
          description:
            "Por favor, envie apenas imagens (JPEG, PNG, WebP, etc.)",
        });
        return;
      }
      setFile(file);
      setCompressed(null);

      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);

      toast.success("Imagem carregada", {
        description: file.name,
      });
    },
    [multiple, onFiles, setFile, setPreview, setCompressed],
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) handleFiles(files);
    },
    [handleFiles, setDragActive],
  );

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      if (files.length > 0) handleFiles(files);
      e.target.value = "";
    },
    [handleFiles],
  );

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
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
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
      }}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      onKeyDown={handleKeyDown}
    >
      <input
        ref={inputRef}
        id="file-input"
        type="file"
        accept="image/*"
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
          className="object-contain p-4"
          priority
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
