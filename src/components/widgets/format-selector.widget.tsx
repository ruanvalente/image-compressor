"use client";

import { useId } from "react";
import { useCompressorStore } from "@/lib/store/compressor-store";
import { Button } from "@/components/ui";
import { COMPRESS_FORMATS } from "@/lib/constants";

export function FormatSelector() {
  const format = useCompressorStore((s) => s.settings.format);
  const setSettings = useCompressorStore((s) => s.setSettings);
  const groupId = useId();

  return (
    <fieldset>
      <legend className="mb-2 block text-sm font-medium text-zinc-800">
        Formato de saída
      </legend>
      <div
        role="radiogroup"
        aria-label="Selecione o formato de saída"
        aria-describedby={`${groupId}-hint`}
        className="flex gap-2"
      >
        {COMPRESS_FORMATS.map((f) => (
          <Button
            key={f}
            variant={format === f ? "primary" : "secondary"}
            onClick={() => setSettings({ format: f })}
            className="flex-1"
            role="radio"
            aria-checked={format === f}
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