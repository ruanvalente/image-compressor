"use client";

import Image from "next/image";
import { Card } from "@/components/ui";

interface ImagePreviewProps {
  src: string;
  alt: string;
  emptyMessage?: string;
}

export function ImagePreview({ src, alt, emptyMessage = "Resultado aparecerá aqui" }: ImagePreviewProps) {
  if (!src) {
    return (
      <Card variant="dashed" className="flex h-64 items-center justify-center">
        <p className="text-zinc-400">{emptyMessage}</p>
      </Card>
    );
  }

  return (
    <Card className="relative h-64 overflow-hidden">
      <Image src={src} alt={alt} fill className="object-contain p-4" />
    </Card>
  );
}