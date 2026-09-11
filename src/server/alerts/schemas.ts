import { z } from "zod";

export const CreateAlertSchema = z.object({
  email: z.string().email().max(200),
  productSlug: z.string().min(1).max(200),
  targetPrice: z.coerce.number().positive().max(9_999_999),
  zoneSlug: z.string().min(1).max(80).default("caba-palermo"),
});
export type CreateAlertInput = z.infer<typeof CreateAlertSchema>;
