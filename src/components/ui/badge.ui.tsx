import { HTMLAttributes, forwardRef } from "react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "danger" | "info";
}

const variantStyles = {
  default: "border border-border bg-surface-muted text-text-muted",
  success: "bg-success-muted text-success-strong",
  danger: "bg-error-muted text-error-strong",
  info: "bg-primary-muted text-primary-strong",
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = "default", className = "", children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {children}
      </span>
    );
  },
);

Badge.displayName = "Badge";
