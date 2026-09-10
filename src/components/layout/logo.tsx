import { cn } from "@/lib/cn";

/** Logo Barato.ar (C-005). Wordmark simple: "Barato" en foreground + ".ar" en primary. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-baseline text-xl font-extrabold tracking-tight", className)}>
      <span className="text-text">Barato</span>
      <span className="text-primary">.ar</span>
    </span>
  );
}

/** Solo el ícono cuadrado (para favicons y og). */
export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={className}
      aria-hidden
    >
      <rect width="32" height="32" rx="8" fill="var(--color-primary)" />
      <path d="M8 22V10h6.5a3.5 3.5 0 0 1 0 7H12" stroke="white" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path d="M18 22 22 10M22 10h4M22 10v6" stroke="white" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
