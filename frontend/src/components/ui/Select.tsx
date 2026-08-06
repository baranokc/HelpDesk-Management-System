import { SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string | number; label: string }>;
  placeholder?: string;
  hint?: string;
}

export function Select({
  label,
  error,
  options,
  placeholder = "Select",
  hint,
  className = "",
  ...props
}: SelectProps) {
  return (
    <fieldset className="fieldset">
      {label && (
        <legend className="fieldset-legend">
          {label}
        </legend>
      )}
      <select
        aria-invalid={Boolean(error)}
        className={`select w-full ${error ? "select-error" : ""} ${className}`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {(error || hint) && (
        <p className={`label ${error ? "text-error" : ""}`}>{error ?? hint}</p>
      )}
    </fieldset>
  );
}
