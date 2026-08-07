import type { ReactNode } from "react";

interface IconProps {
  className?: string;
}

function IconBase({ className = "", children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function UploadIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M12 16V4" />
      <path d="m6 10 6-6 6 6" />
      <path d="M4 20h16" />
    </IconBase>
  );
}

export function DownloadIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M12 4v12" />
      <path d="m6 10 6 6 6-6" />
      <path d="M4 20h16" />
    </IconBase>
  );
}

export function ImageIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="10" r="2" />
      <path d="m21 15-3.5-3.5a2 2 0 0 0-2.8 0L6 20" />
    </IconBase>
  );
}

export function DocumentIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M9 13h6" />
      <path d="M9 17h6" />
    </IconBase>
  );
}

export function CheckIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="m5 12 5 5L20 7" />
    </IconBase>
  );
}

export function XIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M6 6l12 12M18 6 6 18" />
    </IconBase>
  );
}

export function ChevronUpIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="m5 15 7-7 7 7" />
    </IconBase>
  );
}

export function ChevronDownIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="m5 9 7 7 7-7" />
    </IconBase>
  );
}
