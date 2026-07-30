interface AlertProps {
  children: React.ReactNode;
  variant?: "error" | "success" | "info";
}

const styles = {
  error: "alert-error",
  success: "alert-success",
  info: "alert-info",
};

export function Alert({ children, variant = "info" }: AlertProps) {
  return (
    <div className={`alert ${styles[variant]}`} role="alert">
      <span>{children}</span>
    </div>
  );
}
