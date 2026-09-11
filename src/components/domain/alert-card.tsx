"use client";

import { Bell, Check, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";

export type AlertCardProps = {
  productSlug: string;
  currentPrice?: number | undefined;
  className?: string | undefined;
  zoneSlug?: string | undefined;
};

type ClientState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export function AlertCard({ productSlug, currentPrice, className, zoneSlug = "caba-palermo" }: AlertCardProps) {
  const [email, setEmail] = useState("");
  const [target, setTarget] = useState(currentPrice ? String(Math.floor(currentPrice * 0.9)) : "");
  const [state, setState] = useState<ClientState>({ status: "idle" });

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email || !target) return;
    setState({ status: "submitting" });
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          productSlug,
          targetPrice: Number(target),
          zoneSlug,
        }),
      });
      if (res.status === 429) {
        setState({ status: "error", message: "Demasiadas alertas — intentá más tarde." });
        return;
      }
      if (res.status === 422 || res.status === 404) {
        setState({ status: "error", message: "Datos inválidos. Revisá el email y el precio." });
        return;
      }
      if (!res.ok) {
        setState({ status: "error", message: "Falló el envío. Reintentá." });
        return;
      }
      const data = (await res.json()) as { message?: string };
      setState({
        status: "success",
        message: data.message ?? "Revisá tu casilla para confirmar la alerta.",
      });
    } catch {
      setState({ status: "error", message: "Sin conexión. Reintentá." });
    }
  }

  return (
    <section
      className={cn(
        "flex flex-col gap-4 rounded-[var(--radius-lg)] bg-gradient-to-br from-primary to-[#6366f1] p-6 text-[var(--color-primary-fg)] shadow-md",
        className,
      )}
      aria-labelledby="alert-card-title"
    >
      <div className="flex size-11 items-center justify-center rounded-[var(--radius)] bg-white/15">
        <Bell className="size-5" aria-hidden />
      </div>
      <div>
        <h3 id="alert-card-title" className="text-lg font-bold tracking-tight">
          Avisame cuando baje
        </h3>
        <p className="mt-1 text-sm opacity-90">
          Sin registro. Dejás tu email y te avisamos cuando llegue al precio que buscás.
        </p>
      </div>

      {state.status === "success" ? (
        <div className="flex items-start gap-2 rounded-[var(--radius)] bg-white/15 p-3 text-sm">
          <Check className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{state.message}</span>
        </div>
      ) : (
        <form className="flex flex-col gap-2" onSubmit={submit}>
          <label className="flex flex-col gap-1">
            <span className="text-2xs font-semibold uppercase tracking-wider opacity-75">Tu email</span>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vos@ejemplo.com"
              className="bg-white text-text"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-2xs font-semibold uppercase tracking-wider opacity-75">
              Avisame cuando baje de
            </span>
            <div className="flex items-center rounded-[var(--radius)] bg-white pl-3 text-text">
              <span className="text-base font-medium text-text-muted">$</span>
              <Input
                type="number"
                required
                min={0}
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="800"
                className="border-0 bg-transparent focus-visible:outline-none"
              />
            </div>
          </label>
          {state.status === "error" ? (
            <div className="flex items-start gap-2 rounded-[var(--radius)] bg-discount/20 p-2 text-2xs">
              <X className="mt-0.5 size-3 shrink-0" aria-hidden />
              <span>{state.message}</span>
            </div>
          ) : null}
          <Button
            type="submit"
            variant="secondary"
            className="mt-2 bg-white text-primary hover:bg-white/90"
            loading={state.status === "submitting"}
          >
            Crear alerta
          </Button>
          <span className="text-center text-2xs opacity-75">
            Podés cancelar en cualquier momento. No mandamos spam.
          </span>
        </form>
      )}
    </section>
  );
}
