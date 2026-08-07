"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { useCompressorStore } from "@/lib/store/compressor-store";
import { usePdfStore } from "@/lib/store/pdf-store";
import { CompressMode } from "./compress-mode.widget";

const PdfGenerator = dynamic(
  () => import("./pdf-generator.widget").then((m) => m.PdfGenerator),
  {
    loading: () => (
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex h-56 items-center justify-center rounded-xl border-2 border-dashed border-border-strong bg-surface sm:h-64">
          <p className="text-sm text-text-subtle">Carregando ferramenta de PDF...</p>
        </div>
      </div>
    ),
  },
);

type Mode = "compress" | "pdf";

function ModeToggle({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  return (
    <fieldset className="mb-6">
      <legend className="sr-only">Selecione a ferramenta</legend>
      <div className="flex gap-1 rounded-xl border border-border bg-surface-muted p-1">
        <button
          type="button"
          aria-pressed={mode === "compress"}
          onClick={() => onChange("compress")}
          className={`flex flex-1 items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-1 ${
            mode === "compress"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-text-muted hover:bg-surface hover:text-text"
          }`}
        >
          Compressor
        </button>
        <button
          type="button"
          aria-pressed={mode === "pdf"}
          onClick={() => onChange("pdf")}
          className={`flex flex-1 items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-1 ${
            mode === "pdf"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-text-muted hover:bg-surface hover:text-text"
          }`}
        >
          PDF
        </button>
      </div>
    </fieldset>
  );
}

export function ToolSwitcher() {
  const [mode, setMode] = useState<Mode>("compress");

  const handleModeChange = useCallback((newMode: Mode) => {
    if (newMode !== "compress") {
      useCompressorStore.getState().reset();
    }
    if (newMode !== "pdf") {
      usePdfStore.getState().reset();
    }
    setMode(newMode);
  }, []);

  return (
    <>
      <ModeToggle mode={mode} onChange={handleModeChange} />
      {mode === "compress" ? <CompressMode /> : <PdfGenerator />}
    </>
  );
}
