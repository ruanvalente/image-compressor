"use client";

import { useId } from "react";
import { useCompressorStore } from "@/lib/store/compressor-store";
import { Button } from "@/components/ui";
import type { CompressionSettings } from "@/lib/store/compressor-store";

const formats: CompressionSettings["format"][] = ["jpeg", "png", "webp", "avif"];

export function FormatSelector() {
  const { settings, setSettings } = useCompressorStore();
  const groupId = useId();

  return (
    <fieldset>
      <legend className="mb-2 block text-sm font-medium text-zinc-700">
        Formato de saída
      </legend>
      <div
        role="radiogroup"
        aria-label="Selecione o formato de saída"
        aria-describedby={`${groupId}-hint`}
        className="flex gap-2"
      >
        {formats.map((f) => (
          <Button
            key={f}
            variant={settings.format === f ? "primary" : "secondary"}
            onClick={() => setSettings({ format: f })}
            className="flex-1"
            role="radio"
            aria-checked={settings.format === f}
            aria-label={`Formato ${f.toUpperCase()}`}
          >
            {f}
          </Button>
        ))}
      </div>
      <span id={`${groupId}-hint`} className="sr-only">
        Escolha o formato desejado para a imagem comprimida
      </span>
    </fieldset>
  );
}