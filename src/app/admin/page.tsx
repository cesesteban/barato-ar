import { auth } from "@/lib/auth";

export default async function AdminHomePage() {
  const session = await auth();
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight">Admin · Barato.ar</h1>
      <p className="mt-2 text-text-muted">
        Autenticado como <strong>{session?.user?.email ?? "desconocido"}</strong>.
      </p>
      <p className="mt-4 text-sm text-text-subtle">
        Las páginas de administración de features siguientes (F03 ingest status, F05 normalizer queue,
        F11 reports queue) se agregarán acá.
      </p>
    </main>
  );
}
