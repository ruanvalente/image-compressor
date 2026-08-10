import { CSSProperties, InputHTMLAttributes, forwardRef, useId } from "react";

interface RangeSliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  showValue?: boolean;
  valueFormat?: (value: number) => string;
}

export const RangeSlider = forwardRef<HTMLInputElement, RangeSliderProps>(
  ({ label, showValue = true, valueFormat, className = "", value, min = 0, max = 100, ...props }, ref) => {
    const generatedId = useId();
    const inputId = props.id || generatedId;
    const numericValue = Number(value);
    const displayValue = valueFormat ? valueFormat(numericValue) : `${value}%`;
    const fillPercent = ((numericValue - Number(min)) / (Number(max) - Number(min))) * 100;
    const fillStyle = {
      "--fill": `${Math.min(100, Math.max(0, fillPercent))}%`,
    } as CSSProperties;

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
          min={min}
          max={max}
          style={fillStyle}
          className={`range-input w-full ${className}`}
          {...props}
          aria-label={label ? undefined : props["aria-label"]}
          aria-valuemin={Number(min)}
          aria-valuemax={Number(max)}
          aria-valuenow={numericValue}
          aria-valuetext={displayValue}
        />
      </div>
    );
  },
);

RangeSlider.displayName = "RangeSlider";
