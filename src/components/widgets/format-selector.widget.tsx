"use client";

import { useCompressorStore } from "@/lib/store/compressor-store";
import { RadioGroup } from "@/components/ui";
import { COMPRESS_FORMATS } from "@/lib/constants";

export function FormatSelector() {
  const format = useCompressorStore((s) => s.settings.format);
  const setSettings = useCompressorStore((s) => s.setSettings);

  const options = COMPRESS_FORMATS.map((f) => ({ value: f, label: f }));

  return (
    <RadioGroup
      name="compress-format"
      legend="Formato de saída"
      hint="Escolha o formato desejado para a imagem comprimida"
      options={options}
      value={format}
      onChange={(value) => setSettings({ format: value })}
    />
  );
}