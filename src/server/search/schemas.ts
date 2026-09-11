/**
 * Contratos Zod del endpoint de búsqueda (F006).
 */

import { z } from "zod";

export const SearchParamsSchema = z.object({
  q: z.string().trim().min(2).max(100),
  zone: z.string().optional(),
  vertical: z.enum(["supermarket", "delivery", "pharmacy", "beverages"]).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
export type SearchParams = z.infer<typeof SearchParamsSchema>;

export const AutocompleteParamsSchema = z.object({
  q: z.string().trim().min(1).max(50),
});

export type SearchResultItem = {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  imageUrl: string | null;
  minPrice: number | null;
  chainCount: number;
  score: number;
};

export type SearchResponse = {
  results: SearchResultItem[];
  suggestion: string | null;
  total: number;
  ms: number;
};

export type AutocompleteResponse = {
  products: Array<{ slug: string; label: string }>;
  brands: Array<{ label: string; count: number }>;
  categories: Array<{ slug: string; label: string; count: number }>;
};

export type PopularSearchesResponse = {
  zone: string;
  items: Array<{ query: string; count: number }>;
};
