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
  className?: string;
}

export function RadioGroup<T extends string>({
  name,
  legend,
  options,
  value,
  onChange,
  hint,
  className = "",
}: RadioGroupProps<T>) {
  const hintId = `${name}-hint`;

  return (
    <fieldset>
      <legend className="mb-2 block text-sm font-medium text-zinc-800">
        {legend}
      </legend>
      <div className={`flex gap-2 ${className}`}>
        {options.map((opt) => (
          <label key={opt.value} className="relative flex-1 cursor-pointer">
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              aria-describedby={hint ? hintId : undefined}
              className="peer sr-only"
            />
            <span className="flex items-center justify-center rounded-lg bg-zinc-200 py-3 px-4 text-base font-medium text-zinc-900 transition-colors hover:bg-zinc-300 peer-checked:bg-blue-600 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500 peer-focus-visible:ring-offset-2">
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
