/**
 * Vitest setup — seedeamos envs mínimas para que `@/lib/env` no falle
 * al primer acceso lazy. Tests que necesiten envs específicas las
 * sobreescriben en su propio beforeEach.
 */
process.env["NEXT_PUBLIC_APP_URL"] ??= "http://localhost:3000";
process.env["DATABASE_URL"] ??= "postgresql://test:test@localhost:5432/test";
process.env["DATABASE_URL_UNPOOLED"] ??= "postgresql://test:test@localhost:5432/test";
process.env["AUTH_SECRET"] ??= "test-secret-32-bytes-1234567890abcd";
process.env["AUTH_URL"] ??= "http://localhost:3000";
process.env["REVALIDATE_SECRET"] ??= "test-revalidate-secret-16b";
