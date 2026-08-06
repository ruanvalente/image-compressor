"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { useCompressorStore } from "@/lib/store/compressor-store";
import { usePdfStore } from "@/lib/store/pdf-store";
import { CompressMode } from "./compress-mode.widget";

const PdfMode = dynamic(
  () => import("./pdf-mode.widget").then((m) => m.PdfMode),
  {
    loading: () => (
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="flex h-64 items-center justify-center rounded-xl border-2 border-dashed border-zinc-200 bg-white">
            <p className="text-sm text-zinc-500">Carregando ferramenta de PDF...</p>
          </div>
        </div>
      </div>
    ),
  },
);

type Mode = "compress" | "pdf";

function ModeToggle({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  return (
    <div
      role="tablist"
      aria-label="Selecione a ferramenta"
      className="mb-6 flex overflow-hidden rounded-lg border border-zinc-300"
    >
      <button
        type="button"
        role="tab"
        aria-selected={mode === "compress"}
        onClick={() => onChange("compress")}
        className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 ${
          mode === "compress"
            ? "bg-blue-600 text-white"
            : "bg-white text-zinc-700 hover:bg-zinc-100"
        }`}
      >
        Compressor
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === "pdf"}
        onClick={() => onChange("pdf")}
        className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 ${
          mode === "pdf"
            ? "bg-blue-600 text-white"
            : "bg-white text-zinc-700 hover:bg-zinc-100"
        }`}
      >
        PDF
      </button>
    </div>
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
      {mode === "compress" ? <CompressMode /> : <PdfMode />}
    </>
  );
}
