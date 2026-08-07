"use client";

import Image from "next/image";
import { EmptyState, ImageIcon } from "@/components/ui";

interface ImagePreviewProps {
  src: string;
  alt: string;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function ImagePreview({
  src,
  alt,
  emptyTitle = "Seu resultado aparecerá aqui",
  emptyDescription = "Envie uma imagem e inicie a compressão para ver o resultado.",
}: ImagePreviewProps) {
  if (!src) {
    return (
      <EmptyState
        icon={<ImageIcon className="h-6 w-6" />}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return (
    <div className="relative h-56 overflow-hidden rounded-xl border border-border bg-surface sm:h-64">
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 1024px) 100vw, 50vw"
        className="object-contain p-4"
      />
    </div>
  );
}
