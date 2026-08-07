"use client";

import { useCompressorStore } from "@/lib/store/compressor-store";
import { RangeSlider } from "@/components/ui";

export function QualityControl() {
  const quality = useCompressorStore((s) => s.settings.quality);
  const format = useCompressorStore((s) => s.settings.format);
  const setSettings = useCompressorStore((s) => s.setSettings);

  const isPng = format === "png";

  return (
    <div>
      <RangeSlider
        label="Qualidade"
        min={10}
        max={100}
        value={quality}
        onChange={(e) => setSettings({ quality: Number(e.target.value) })}
        valueFormat={(v) => `${v}%`}
      />
      {isPng && (
        <p className="mt-2 text-xs text-text-subtle">
          A qualidade não se aplica a PNG — a compressão é sem perdas.
        </p>
      )}
    </div>
  );
}
