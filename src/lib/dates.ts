/**
 * Formato de fechas legible en es-AR ("hace 2h", "hace 3d").
 */

const rtf = new Intl.RelativeTimeFormat("es-AR", { numeric: "auto" });

export function formatDistanceToNow(from: Date | string, ref: Date = new Date()): string {
  const d = typeof from === "string" ? new Date(from) : from;
  const diffMs = ref.getTime() - d.getTime();
  const abs = Math.abs(diffMs);

  const minutes = Math.round(diffMs / 60_000);
  const hours = Math.round(diffMs / 3_600_000);
  const days = Math.round(diffMs / 86_400_000);

  if (abs < 60_000) return "hace unos segundos";
  if (abs < 3_600_000) return rtf.format(-minutes, "minute");
  if (abs < 86_400_000) return rtf.format(-hours, "hour");
  if (abs < 30 * 86_400_000) return rtf.format(-days, "day");
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
}
