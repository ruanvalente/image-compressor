import { InputHTMLAttributes, forwardRef, useId } from "react";

interface RangeSliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  showValue?: boolean;
  valueFormat?: (value: number) => string;
}

export const RangeSlider = forwardRef<HTMLInputElement, RangeSliderProps>(
  ({ label, showValue = true, valueFormat, className = "", value, ...props }, ref) => {
    const generatedId = useId();
    const inputId = props.id || generatedId;
    const displayValue = valueFormat ? valueFormat(Number(value)) : `${value}%`;

    return (
      <div>
        {label && (
          <label
            htmlFor={inputId}
            className="mb-2 flex items-center justify-between text-sm font-medium text-text"
          >
            <span>{label}</span>
            {showValue && value !== undefined && (
              <span className="rounded-md bg-primary-muted px-2 py-0.5 font-semibold text-primary-strong">
                {displayValue}
              </span>
            )}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          type="range"
          value={value}
          className={`w-full accent-primary ${className}`}
          {...props}
          aria-label={label ? undefined : props["aria-label"]}
          aria-valuemin={Number(props.min || 0)}
          aria-valuemax={Number(props.max || 100)}
          aria-valuenow={Number(value)}
          aria-valuetext={displayValue}
        />
      </div>
    );
  },
);

RangeSlider.displayName = "RangeSlider";