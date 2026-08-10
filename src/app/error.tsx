"use client";

import { useEffect } from "react";
import { AlertIcon, Button } from "@/components/ui";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-app flex flex-col items-center py-16 text-center">
      <div className="flex max-w-md flex-col items-center gap-4">
        <p
          className="flex h-14 w-14 items-center justify-center rounded-2xl bg-error-muted text-error-strong"
          aria-hidden="true"
        >
          <AlertIcon className="h-7 w-7" />
        </p>
        <h1 className="text-xl font-bold text-text">Algo deu errado</h1>
        <p className="text-sm text-text-muted">
          Ocorreu um erro inesperado ao carregar esta página. Tente novamente.
        </p>
        <Button onClick={retry}>Tentar novamente</Button>
      </div>
    </div>
  );
}
