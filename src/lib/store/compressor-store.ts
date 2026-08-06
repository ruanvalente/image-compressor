import { create } from "zustand";
import type { CompressionResult, CompressionSettings } from "@/lib/types";

interface CompressorStore {
  file: File | null;
  preview: string;
  compressed: CompressionResult | null;
  settings: CompressionSettings;
  loading: boolean;

  setFile: (file: File | null) => void;
  setPreview: (preview: string) => void;
  setCompressed: (result: CompressionResult | null) => void;
  setSettings: (settings: Partial<CompressionSettings>) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

const initialSettings: CompressionSettings = {
  quality: 80,
  format: "jpeg",
};

export const useCompressorStore = create<CompressorStore>((set) => ({
  file: null,
  preview: "",
  compressed: null,
  settings: initialSettings,
  loading: false,

  setFile: (file) => set({ file }),
  setPreview: (preview) => set({ preview }),
  setCompressed: (compressed) => set({ compressed }),
  setSettings: (settings) =>
    set((state) => ({
      settings: { ...state.settings, ...settings },
    })),
  setLoading: (loading) => set({ loading }),
  reset: () =>
    set({
      file: null,
      preview: "",
      compressed: null,
      settings: initialSettings,
      loading: false,
    }),
}));
