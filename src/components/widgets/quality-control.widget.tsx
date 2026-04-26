"use client";

import { useCompressorStore } from "@/lib/store/compressor-store";
import { Card, RangeSlider } from "@/components/ui";

export function QualityControl() {
  const { settings, setSettings } = useCompressorStore();

  return (
    <Card>
      <RangeSlider
        label="Qualidade"
        min={10}
        max={100}
        value={settings.quality}
        onChange={(e) => setSettings({ quality: Number(e.target.value) })}
        valueFormat={(v) => `${v}%`}
      />
    </Card>
  );
}