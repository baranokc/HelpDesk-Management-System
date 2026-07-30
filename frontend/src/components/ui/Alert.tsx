interface AlertProps{children: React.ReactNode; variant?: "error" | "success" | "info"}

const styles = {
    error: "border-red-200 bg-red 50 text-red-700",
    success: "border-emerald-200 bg-emerald 50 text-emerald-700",
    info: "border-blue-200 bg-blue 50 text-emerald-700"
}

export function Alert({children, variant ="info"}: AlertProps) {
    return (
        <div className={'rounded-lg border px-4 py-3 text-sm ${styles[variant]}'}>
            {children}
        </div>
    )
}