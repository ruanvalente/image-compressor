export default function Loading() {
  return (
    <div className="grid gap-8 lg:grid-cols-2" aria-hidden="true">
      <div className="space-y-4">
        <div className="flex h-64 animate-pulse items-center justify-center rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-100" />
        <div className="h-10 animate-pulse rounded-lg bg-zinc-100" />
      </div>
      <div className="space-y-4">
        <div className="flex h-64 animate-pulse items-center justify-center rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-100" />
      </div>
    </div>
  );
}
