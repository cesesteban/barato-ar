import { Badge } from "@/components/ui/badge";

/** ExpiredBadge (C-007) — marca ofertas vencidas. */
export function ExpiredBadge({ daysAgo }: { daysAgo?: number }) {
  const label = daysAgo && daysAgo > 0 ? `Vencida hace ${daysAgo}d` : "Vencida";
  return (
    <Badge variant="neutral" size="sm" aria-label={label}>
      {label}
    </Badge>
  );
}

/** ConsultarBadge (C-007) — precio 0 = consultar en tienda. */
export function ConsultarBadge() {
  return (
    <Badge variant="outline" size="sm" aria-label="Consultar en tienda">
      Consultar en tienda
    </Badge>
  );
}
