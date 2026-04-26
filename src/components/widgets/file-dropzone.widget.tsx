"use client";

import { useCallback, useRef, DragEvent, ChangeEvent } from "react";
import Image from "next/image";
import { useCompressorStore } from "@/lib/store/compressor-store";
import { toast } from "@/lib/utils/toast";

export function FileDropzone() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { preview, dragActive, setDragActive, setFile, setPreview, setCompressed } =
    useCompressorStore();

  const handleFile = useCallback(
    (f: File) => {
      if (!f.type.startsWith("image/")) {
        toast.error("Tipo de arquivo inválido", {
          description: "Por favor, envie apenas imagens (JPEG, PNG, WebP, etc.)",
        });
        return;
      }
      setFile(f);
      setCompressed(null);

      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(f);

      toast.success("Imagem carregada", {
        description: f.name,
      });
    },
    [setFile, setPreview, setCompressed],
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile, setDragActive],
  );

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) handleFile(f);
    },
    [handleFile],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        inputRef.current?.click();
      }
    },
    [],
  );

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Área para enviar imagem. Arraste uma imagem aqui ou clique para selecionar."
      aria-describedby="dropzone-hint"
      className={`relative flex h-64 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
        dragActive ? "border-blue-500 bg-blue-50" : "border-zinc-300 bg-white"
      } ${!preview ? "hover:border-zinc-400" : ""}`}
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
        className="hidden"
        onChange={handleInputChange}
        aria-hidden="true"
      />
      <span id="dropzone-hint" className="sr-only">
        Selecione uma imagem do seu dispositivo para comprimir
      </span>
      {preview ? (
        <Image
          src={preview}
          alt="Prévia da imagem selecionada"
          fill
          className="object-contain p-4"
          priority
        />
      ) : (
        <div className="text-center text-zinc-400">
          <p className="text-3xl" aria-hidden="true">
            📁
          </p>
          <p className="mt-2 text-sm">Arraste uma imagem aqui</p>
          <p className="text-xs">ou clique para selecionar</p>
        </div>
      )}
    </div>
  );
}