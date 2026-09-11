import { z } from "zod";

// Envs opcionales que llegan como "" desde docker-compose deben tratarse
// como ausentes — sino min(1)/url() fallan sobre string vacío.
const optionalString = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), schema.optional());

const envSchema = z.object({
  // App
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_APP_URL: z.string().url(),

  // Database (Neon Postgres)
  DATABASE_URL: z.string().url(),
  DATABASE_URL_UNPOOLED: z.string().url(),

  // Auth.js v5 (C-010)
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET debe tener al menos 32 caracteres"),
  AUTH_URL: z.string().url(),
  ADMIN_EMAILS: z
    .string()
    .default("")
    .transform((s) => new Set(s.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean))),

  // Resend
  RESEND_API_KEY: optionalString(z.string().min(1)),

  // On-demand revalidation (C-008)
  REVALIDATE_SECRET: z.string().min(16),

  // Cloudflare R2 (C-009)
  R2_ACCOUNT_ID: optionalString(z.string().min(1)),
  R2_ACCESS_KEY_ID: optionalString(z.string().min(1)),
  R2_SECRET_ACCESS_KEY: optionalString(z.string().min(1)),
  R2_BUCKET_PRODUCTS: z.string().default("barato-ar-products"),
  R2_BUCKET_REPORTS: z.string().default("barato-ar-reports"),
  NEXT_PUBLIC_R2_PUBLIC_URL: optionalString(z.string().url()),

  // Observability
  SENTRY_DSN: optionalString(z.string().url()),
  NEXT_PUBLIC_SENTRY_DSN: optionalString(z.string().url()),

  // Analytics
  NEXT_PUBLIC_PLAUSIBLE_DOMAIN: optionalString(z.string()),

  // Redis (Upstash)
  UPSTASH_REDIS_REST_URL: optionalString(z.string().url()),
  UPSTASH_REDIS_REST_TOKEN: optionalString(z.string()),

  // Auto-inyectadas por Vercel
  VERCEL_GIT_COMMIT_SHA: z.string().optional(),
  VERCEL_ENV: z.enum(["development", "preview", "production"]).optional(),
});

function parseEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("❌ Variables de entorno inválidas o faltantes:");
    console.error(parsed.error.flatten().fieldErrors);
    throw new Error("Environment validation failed. Ver .env.example.");
  }
  return parsed.data;
}

export const env = parseEnv();
export type Env = z.infer<typeof envSchema>;
