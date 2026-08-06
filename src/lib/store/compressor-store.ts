import { create } from "zustand";

export interface CompressionResult {
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  format: string;
  filename: string;
  data: string;
}

export interface CompressionSettings {
  quality: number;
  format: "jpeg" | "png" | "webp" | "avif";
}

interface CompressorStore {
  file: File | null;
  preview: string;
  compressed: CompressionResult | null;
  settings: CompressionSettings;
  loading: boolean;
  dragActive: boolean;

  setFile: (file: File | null) => void;
  setPreview: (preview: string) => void;
  setCompressed: (result: CompressionResult | null) => void;
  setSettings: (settings: Partial<CompressionSettings>) => void;
  setLoading: (loading: boolean) => void;
  setDragActive: (active: boolean) => void;
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
  dragActive: false,

  setFile: (file) => set({ file }),
  setPreview: (preview) => set({ preview }),
  setCompressed: (compressed) => set({ compressed }),
  setSettings: (settings) =>
    set((state) => ({
      settings: { ...state.settings, ...settings },
    })),
  setLoading: (loading) => set({ loading }),
  setDragActive: (dragActive) => set({ dragActive }),
  reset: () =>
    set({
      file: null,
      preview: "",
      compressed: null,
      settings: initialSettings,
      loading: false,
      dragActive: false,
    }),
}));