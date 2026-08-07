"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
} from "react";

export function useFileDropzone(onFiles: (files: File[]) => void) {
  const [dragActive, setDragActive] = useState(false);
  const onFilesRef = useRef(onFiles);
  const dragDepthRef = useRef(0);

  useEffect(() => {
    onFilesRef.current = onFiles;
  }, [onFiles]);

  const handleDragEnter = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current += 1;
    setDragActive(true);
  }, []);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      dragDepthRef.current = 0;
      setDragActive(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) onFilesRef.current(files);
    },
    [],
  );

  return {
    dragActive,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
}
