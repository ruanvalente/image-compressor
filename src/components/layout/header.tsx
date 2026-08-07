function LogoIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  );
}

export function Header() {
  return (
    <header className="border-b border-border bg-surface">
      <div className="container-app flex items-center gap-3 py-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <LogoIcon />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg font-bold leading-tight tracking-tight text-text sm:text-xl">
            Image Compressor
          </h1>
          <p className="text-sm text-text-muted">
            Comprimir imagens mantendo a melhor qualidade
          </p>
        </div>
      </div>
    </header>
  );
}
