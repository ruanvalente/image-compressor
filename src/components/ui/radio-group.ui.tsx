export interface RadioGroupOption<T extends string> {
  value: T;
  label: string;
}

interface RadioGroupProps<T extends string> {
  name: string;
  legend: string;
  options: readonly RadioGroupOption<T>[];
  value: T;
  onChange: (value: T) => void;
  hint?: string;
  disabled?: boolean;
  className?: string;
}

export function RadioGroup<T extends string>({
  name,
  legend,
  options,
  value,
  onChange,
  hint,
  disabled = false,
  className = "flex flex-wrap gap-2",
}: RadioGroupProps<T>) {
  const hintId = `${name}-hint`;

  return (
    <fieldset>
      <legend className="mb-2 block text-sm font-medium text-text">
        {legend}
      </legend>
      <div className={className}>
        {options.map((opt) => (
          <label key={opt.value} className="relative flex-1 cursor-pointer">
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              disabled={disabled}
              aria-describedby={hint ? hintId : undefined}
              className="peer sr-only"
            />
            <span className="flex w-full items-center justify-center rounded-lg border border-border bg-surface px-4 py-3 text-base font-medium text-text transition-colors peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-focus peer-focus-visible:ring-offset-2 peer-enabled:hover:border-border-strong peer-enabled:hover:bg-surface-muted peer-disabled:cursor-not-allowed peer-disabled:opacity-50">
              {opt.label}
            </span>
          </label>
        ))}
      </div>
      {hint && (
        <span id={hintId} className="sr-only">
          {hint}
        </span>
      )}
    </fieldset>
  );
}
