import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "success" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
}

const variantStyles = {
  primary: "bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active",
  secondary: "bg-surface-muted text-text hover:bg-border",
  success: "bg-success text-primary-foreground hover:bg-success/90",
  danger: "text-error hover:bg-error-muted",
  ghost: "bg-transparent text-text-muted hover:bg-surface-muted hover:text-text",
};

const sizeStyles = {
  sm: "py-1.5 px-3 text-sm",
  md: "py-3 px-4 text-base",
  lg: "py-3.5 px-6 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className = "", disabled, children, type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        className={`
          inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2
          disabled:cursor-not-allowed disabled:opacity-50
          ${variantStyles[variant]}
          ${variant !== "danger" && variant !== "ghost" ? sizeStyles[size] : ""}
          ${className}
        `}
        {...props}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
