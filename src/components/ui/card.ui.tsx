import { HTMLAttributes, forwardRef } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "dashed";
}

const variantStyles = {
  default: "border border-border bg-surface shadow-sm",
  dashed: "border-2 border-dashed border-border-strong bg-surface",
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = "default", className = "", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`rounded-xl p-4 ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = "Card";
