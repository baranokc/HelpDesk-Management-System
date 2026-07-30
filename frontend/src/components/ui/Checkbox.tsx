import type { InputHTMLAttributes } from "react";

interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
}

export function Checkbox({ label, className = "", ...props }: CheckboxProps) {
  return (
    <label className="label cursor-pointer justify-start gap-3">
      <input
        className={`checkbox checkbox-primary ${className}`}
        type="checkbox"
        {...props}
      />
      <span>{label}</span>
    </label>
  );
}
