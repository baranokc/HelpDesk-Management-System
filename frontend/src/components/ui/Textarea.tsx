import { TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Textarea({
  label,
  error,
  hint,
  className = "",
  ...props
}: TextareaProps) {
  return (
    <fieldset className="fieldset">
      {label && (
        <legend className="fieldset-legend">
          {label}
        </legend>
      )}
      <textarea
        aria-invalid={Boolean(error)}
        className={`textarea min-h-28 w-full resize-y ${error ? "textarea-error" : ""} ${className}`}
        {...props}
      />
      {(error || hint) && (
        <p className={`label ${error ? "text-error" : ""}`}>{error ?? hint}</p>
      )}
    </fieldset>
  );
}
