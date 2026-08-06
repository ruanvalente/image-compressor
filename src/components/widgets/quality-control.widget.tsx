"use client";

import { useCompressorStore } from "@/lib/store/compressor-store";
import { Card, RangeSlider } from "@/components/ui";

export function QualityControl() {
  const quality = useCompressorStore((s) => s.settings.quality);
  const setSettings = useCompressorStore((s) => s.setSettings);

  return (
    <Card>
      <RangeSlider
        label="Qualidade"
        min={10}
        max={100}
        value={quality}
        onChange={(e) => setSettings({ quality: Number(e.target.value) })}
        valueFormat={(v) => `${v}%`}
      />
    </Card>
  );
}