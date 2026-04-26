import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "success" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
}

const variantStyles = {
  primary: "bg-blue-600 text-white hover:bg-blue-700",
  secondary: "bg-zinc-100 text-zinc-600 hover:bg-zinc-200",
  success: "bg-green-600 text-white hover:bg-green-700",
  danger: "text-red-500 hover:text-red-700",
  ghost: "bg-transparent text-zinc-600 hover:bg-zinc-100",
};

const sizeStyles = {
  sm: "py-1.5 px-3 text-sm",
  md: "py-3 px-4 text-base",
  lg: "py-4 px-6 text-lg",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className = "", disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={`
          rounded-lg font-medium transition-colors
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