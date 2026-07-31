import Link, { type LinkProps } from "next/link";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
} from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonStyleProps {
  variant?: Variant;
  size?: Size;
  className?: string;
}

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    ButtonStyleProps {
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  primary: "btn-outline btn-primary",
  secondary: "btn-outline btn-neutral",
  danger: "btn-outline btn-error",
  ghost: "btn-outline btn-neutral",
};

const sizes: Record<Size, string> = {
  sm: "btn-sm",
  md: "",
  lg: "btn-lg",
};

function getButtonClassName({
  variant = "primary",
  size = "md",
  className = "",
}: ButtonStyleProps): string {
  return [
    "btn",
    variants[variant],
    sizes[size],
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

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
      className={getButtonClassName({
        variant,
        size,
        className,
      })}
      disabled={disabled || loading}
      type={type}
      {...props}
    >
      {loading && (
        <span aria-hidden="true" className="loading loading-spinner loading-sm" />
      )}
      {children}
    </button>
  );
}

type LinkButtonProps = LinkProps &
  Omit<
    AnchorHTMLAttributes<HTMLAnchorElement>,
    "href"
  > &
  ButtonStyleProps;

export function LinkButton({
  variant = "primary",
  size = "md",
  className = "",
  children,
  href,
  ...props
}: LinkButtonProps) {
  return (
    <Link
      className={getButtonClassName({
        variant,
        size,
        className,
      })}
      href={href}
      {...props}
    >
      {children}
    </Link>
  );
}
