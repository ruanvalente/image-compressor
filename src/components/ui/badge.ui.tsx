import { HTMLAttributes, forwardRef } from "react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "danger" | "info";
}

const variantStyles = {
  default: "bg-zinc-200 text-zinc-800",
  success: "bg-green-100 text-green-800",
  danger: "bg-red-100 text-red-800",
  info: "bg-blue-100 text-blue-800",
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