import { z } from "zod";

export const CreateReportSchema = z.object({
  productSlug: z.string().min(1).max(200).optional(),
  productText: z.string().min(2).max(200).optional(),
  chainSlug: z.string().min(1).max(80),
  storeText: z.string().max(200).optional(),
  storeId: z.string().max(80).optional(),
  price: z.coerce.number().positive().max(9_999_999),
  previousPrice: z.coerce.number().positive().max(9_999_999).optional(),
  validTo: z.string().datetime().optional(),
  description: z.string().max(500).optional(),
  turnstileToken: z.string().max(2048).optional(),
});
export type CreateReportInput = z.infer<typeof CreateReportSchema>;
