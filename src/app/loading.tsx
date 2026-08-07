export default function Loading() {
  return (
    <div
      className="container-app grid gap-8 py-6 sm:py-10 lg:grid-cols-2"
      aria-hidden="true"
    >
      <div className="space-y-4">
        <div className="flex h-64 animate-pulse items-center justify-center rounded-xl border-2 border-dashed border-border bg-surface-muted" />
        <div className="h-10 animate-pulse rounded-lg bg-surface-muted" />
      </div>
      <div className="space-y-4">
        <div className="flex h-64 animate-pulse items-center justify-center rounded-xl border-2 border-dashed border-border bg-surface-muted" />
      </div>
    </div>
  );
}
