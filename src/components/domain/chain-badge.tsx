import { cn } from "@/lib/cn";

/**
 * ChainBadge — logo/nombre de la cadena.
 * Mapping temporal a texto; cuando haya logos, se reemplaza por `next/image`.
 */
const CHAIN_NAMES: Record<string, string> = {
  carrefour: "Carrefour",
  coto: "Coto",
  dia: "Día",
  jumbo: "Jumbo",
  vea: "Vea",
  disco: "Disco",
  "la-anonima": "La Anónima",
  changomas: "Changomas",
  farmacity: "Farmacity",
  pedidosya: "PedidosYa",
  rappi: "Rappi",
};

export type ChainBadgeProps = {
  slug: string;
  label?: string | undefined;
  variant?: "chip" | "text" | undefined;
  className?: string | undefined;
};

export function ChainBadge({ slug, label, variant = "chip", className }: ChainBadgeProps) {
  const name = label ?? CHAIN_NAMES[slug] ?? slug;
  if (variant === "text") {
    return (
      <span className={cn("text-xs font-semibold uppercase tracking-wide text-text-subtle", className)}>
        {name}
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border border-border bg-surface px-2 py-1 text-2xs font-semibold text-text-muted",
        className,
      )}
    >
      {name}
    </span>
  );
}
