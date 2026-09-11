import { z } from "zod";

export const HistoryParamsSchema = z.object({
  slug: z.string().min(1).max(200),
  zone: z.string().min(1).max(80).default("caba-palermo"),
  days: z.coerce.number().int().min(7).max(400).default(90),
});
export type HistoryParams = z.infer<typeof HistoryParamsSchema>;

export type HistoryPoint = {
  day: string;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  obsCount: number;
};

export type HistoryStats = {
  current: number | null;
  avg: number | null;
  min: { price: number; day: string } | null;
  max: { price: number; day: string } | null;
};

export type HistoryResponse = {
  slug: string;
  zone: string;
  days: number;
  points: HistoryPoint[];
  stats: HistoryStats;
  currency: "ARS";
  ms: number;
};
