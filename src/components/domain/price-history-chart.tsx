/**
 * PriceHistoryChart — SVG puro SSR-safe.
 * En F002 solo la estructura + placeholder. F010 lo llena con datos reales.
 */

export type HistoryPoint = { day: string; avgPrice: number };

export type PriceHistoryChartProps = {
  data: HistoryPoint[];
  currency?: string;
  width?: number;
  height?: number;
  ariaLabel?: string;
};

export function PriceHistoryChart({
  data,
  width = 800,
  height = 220,
  ariaLabel = "Historial de precios",
}: PriceHistoryChartProps) {
  if (data.length < 2) {
    return (
      <div
        role="img"
        aria-label="Sin historial suficiente"
        className="flex h-56 items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-border text-sm text-text-subtle"
      >
        Aún no tenemos suficiente historial para este producto.
      </div>
    );
  }

  const prices = data.map((d) => d.avgPrice);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = Math.max(max - min, 1);
  const xStep = width / Math.max(data.length - 1, 1);

  const points = data.map((d, i) => {
    const x = i * xStep;
    const y = height - ((d.avgPrice - min) / range) * height;
    return { x, y, ...d };
  });

  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const area = `${path} L${width},${height} L0,${height} Z`;
  const last = points[points.length - 1]!;

  return (
    <svg
      role="img"
      aria-label={ariaLabel}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="h-56 w-full"
    >
      <defs>
        <linearGradient id="phg-grad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.2" />
          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#phg-grad)" />
      <path
        d={path}
        stroke="var(--color-primary)"
        strokeWidth={2.4}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last.x} cy={last.y} r={5} fill="var(--color-primary)" />
    </svg>
  );
}
