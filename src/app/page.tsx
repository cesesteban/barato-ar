import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-6 px-6 py-16">
      <span className="inline-flex items-center gap-2 self-start rounded-full border border-primary-soft bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
        Foundation scaffold · Feature 001
      </span>
      <h1 className="text-5xl font-extrabold tracking-tight text-text">Barato.ar</h1>
      <p className="text-lg text-text-muted">
        Comparador de ofertas de supermercados, delivery y farmacias en Argentina. Todavía sin datos —
        arrancamos por el scaffold. Ver{" "}
        <Link href="/health" className="text-primary underline hover:text-primary-hover">
          /health
        </Link>
        {" "}para verificar la conexión a DB.
      </p>
    </main>
  );
}
