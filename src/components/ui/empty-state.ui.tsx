import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  className?: string;
}

export function EmptyState({ icon, title, description, className = "" }: EmptyStateProps) {
  return (
    <div
      className={`flex h-56 flex-col items-center justify-center rounded-xl border-2 border-dashed border-border-strong bg-surface px-6 text-center sm:h-64 ${className}`}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted text-text-subtle">
        {icon}
      </span>
      <p className="mt-3 text-sm font-medium text-text">{title}</p>
      {description && (
        <p className="mt-1 max-w-60 text-sm text-text-muted">{description}</p>
      )}
    </div>
  );
}
