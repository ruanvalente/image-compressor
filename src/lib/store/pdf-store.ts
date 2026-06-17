import { create } from "zustand";

export type PageSize = "original" | "a4" | "letter";

export interface PdfResult {
  data: string;
  filename: string;
  pageCount: number;
  size: number;
}

interface PdfStore {
  files: File[];
  previews: string[];
  result: PdfResult | null;
  loading: boolean;
  error: string;
  pageSize: PageSize;

  addFiles: (files: File[]) => void;
  removeFile: (index: number) => void;
  moveFile: (from: number, to: number) => void;
  setResult: (result: PdfResult | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string) => void;
  setPageSize: (size: PageSize) => void;
  reset: () => void;
}

export const usePdfStore = create<PdfStore>((set) => ({
  files: [],
  previews: [],
  result: null,
  loading: false,
  error: "",
  pageSize: "original",

  addFiles: (newFiles) =>
    set((state) => ({
      files: [...state.files, ...newFiles],
      previews: [
        ...state.previews,
        ...newFiles.map((f) => URL.createObjectURL(f)),
      ],
      result: null,
    })),

  removeFile: (index) =>
    set((state) => {
      URL.revokeObjectURL(state.previews[index]);
      return {
        files: state.files.filter((_, i) => i !== index),
        previews: state.previews.filter((_, i) => i !== index),
        result: null,
      };
    }),

  moveFile: (from, to) =>
    set((state) => {
      if (
        from < 0 ||
        from >= state.files.length ||
        to < 0 ||
        to >= state.files.length ||
        from === to
      ) {
        return state;
      }
      const files = [...state.files];
      const previews = [...state.previews];
      const [movedFile] = files.splice(from, 1);
      const [movedPreview] = previews.splice(from, 1);
      files.splice(to, 0, movedFile);
      previews.splice(to, 0, movedPreview);
      return { files, previews, result: null };
    }),

  setResult: (result) => set({ result }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setPageSize: (pageSize) => set({ pageSize, result: null }),
  reset: () => {
    set((state) => {
      state.previews.forEach((p) => URL.revokeObjectURL(p));
      return {
        files: [],
        previews: [],
        result: null,
        loading: false,
        error: "",
        pageSize: "original",
      };
    });
  },
}));
