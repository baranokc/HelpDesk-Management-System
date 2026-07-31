import type { ButtonHTMLAttributes } from "react";

type Variant =
  | "primary"
  | "secondary"
  | "danger"
  | "ghost";

type Size = "sm" | "md" | "lg";

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  primary: "btn-outline btn-primary",
  secondary: "btn-outline btn-secondary",
  danger: "btn-outline btn-error",
  ghost: "btn-outline btn-neutral",
};

const sizes: Record<Size, string> = {
  sm: "btn-sm",
  md: "",
  lg: "btn-lg",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className = "",
  disabled,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      className={[
        "btn",
        variants[variant],
        sizes[size],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      disabled={disabled || loading}
      type={type}
      {...props}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="loading loading-spinner loading-sm"
        />
      )}

      {children}
    </button>
  );
}