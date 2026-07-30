import { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({
  label,
  error,
  hint,
  id,
  className = "",
  ...props
}: InputProps) {
  return (
    <fieldset className="fieldset">
      {label && (
        <legend className="fieldset-legend">
          {label}
        </legend>
      )}
      <input
        id={id}
        className={`input w-full ${error ? "input-error" : ""} ${className}`}
        aria-invalid={Boolean(error)}
        {...props}
      />
      {(error || hint) && (
        <p className={`label ${error ? "text-error" : ""}`}>{error ?? hint}</p>
      )}
    </fieldset>
  );
}
