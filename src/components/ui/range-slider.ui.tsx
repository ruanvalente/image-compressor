import { InputHTMLAttributes, forwardRef } from "react";

interface RangeSliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  showValue?: boolean;
  valueFormat?: (value: number) => string;
}

export const RangeSlider = forwardRef<HTMLInputElement, RangeSliderProps>(
  ({ label, showValue = true, valueFormat, className = "", value, ...props }, ref) => {
    const displayValue = valueFormat ? valueFormat(Number(value)) : `${value}%`;

    return (
      <div>
        {label && (
          <label className="mb-2 block text-sm font-medium text-zinc-700">
            {label}
            {showValue && value !== undefined && <span className="ml-1">({displayValue})</span>}
          </label>
        )}
        <input
          ref={ref}
          type="range"
          value={value}
          className={`w-full accent-blue-600 ${className}`}
          {...props}
        />
      </div>
    );
  },
);

RangeSlider.displayName = "RangeSlider";