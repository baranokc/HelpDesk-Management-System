interface AuthMessageProps {
  message: string;
  variant: "success" | "error";
}

export function AuthMessage({
  message,
  variant,
}: AuthMessageProps) {
  const isSuccess = variant === "success";

  return (
    <div
      className={`alert mt-4 text-sm text-white shadow-sm ${
        isSuccess ? "alert-success" : "alert-error"
      }`}
      role={isSuccess ? "status" : "alert"}
    >
      <svg
        aria-hidden="true"
        className="h-6 w-6 shrink-0 stroke-current"
        fill="none"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d={
            isSuccess
              ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              : "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
          }
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>

      <span>{message}</span>
    </div>
  );
}
