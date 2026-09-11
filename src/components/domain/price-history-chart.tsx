/**
 * PriceHistoryChart — SVG puro SSR-safe (F010).
 * Renderiza serie temporal con línea + área + puntos + gridlines.
 */

import { formatPrice } from "@/lib/format-price";

export type HistoryPoint = { day: string; avgPrice: number; minPrice?: number; maxPrice?: number };

export type PriceHistoryChartProps = {
  data: HistoryPoint[];
  width?: number;
  height?: number;
  ariaLabel?: string;
  className?: string | undefined;
};

const W_DEFAULT = 800;
const H_DEFAULT = 220;
const PADDING = { top: 12, right: 12, bottom: 24, left: 56 };

export function PriceHistoryChart({
  data,
  width = W_DEFAULT,
  height = H_DEFAULT,
  ariaLabel = "Historial de precios",
  className,
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

  const innerW = width - PADDING.left - PADDING.right;
  const innerH = height - PADDING.top - PADDING.bottom;

  const prices = data.map((d) => d.avgPrice);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = Math.max(max - min, 1);
  const padY = range * 0.1;

  const yFor = (v: number) =>
    PADDING.top + innerH - ((v - (min - padY)) / (range + padY * 2)) * innerH;
  const xFor = (i: number) => PADDING.left + (i / Math.max(data.length - 1, 1)) * innerW;

  const points = data.map((d, i) => ({ x: xFor(i), y: yFor(d.avgPrice), ...d }));
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const area =
    `${path} L${points[points.length - 1]!.x},${PADDING.top + innerH} L${points[0]!.x},${PADDING.top + innerH} Z`;
  const last = points[points.length - 1]!;

  const yTicks = [min - padY, min, (min + max) / 2, max, max + padY]
    .filter((v, i, arr) => i === 0 || arr[i - 1] !== v)
    .slice(0, 4);

  return (
    <svg
      role="img"
      aria-label={ariaLabel}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      className={className ?? "h-56 w-full"}
    >
      <defs>
        <linearGradient id="phg-grad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.2" />
          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {yTicks.map((v, i) => (
        <g key={`tick-${i}`}>
          <line
            x1={PADDING.left}
            x2={PADDING.left + innerW}
            y1={yFor(v)}
            y2={yFor(v)}
            stroke="var(--color-border)"
            strokeDasharray="3 3"
          />
          <text
            x={PADDING.left - 8}
            y={yFor(v)}
            fill="var(--color-text-subtle)"
            fontSize="11"
            textAnchor="end"
            dominantBaseline="middle"
          >
            {formatPrice(v)}
          </text>
        </g>
      ))}
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
      <circle cx={last.x} cy={last.y} r={10} fill="var(--color-primary)" opacity="0.2" />
      <text
        x={PADDING.left}
        y={height - 6}
        fontSize="11"
        fill="var(--color-text-subtle)"
      >
        {data[0]?.day}
      </text>
      <text
        x={PADDING.left + innerW}
        y={height - 6}
        fontSize="11"
        fill="var(--color-text-subtle)"
        textAnchor="end"
      >
        {last.day}
      </text>
    </svg>
  );
}
