"use client";

import { Bell } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";

/**
 * AlertCard — form email-only para crear alerta de precio (F09).
 * En F002 solo la estructura; el submit real lo cablea F09.
 */
export type AlertCardProps = {
  productSlug: string;
  currentPrice?: number | undefined;
  className?: string | undefined;
  onCreate?:
    | ((payload: { email: string; targetPrice: number; productSlug: string }) => void)
    | undefined;
};

export function AlertCard({ productSlug, currentPrice, className, onCreate }: AlertCardProps) {
  const [email, setEmail] = useState("");
  const [target, setTarget] = useState(currentPrice ? String(Math.floor(currentPrice * 0.9)) : "");
  const [submitting, setSubmitting] = useState(false);

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
      <form
        className="flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!email || !target) return;
          setSubmitting(true);
          onCreate?.({ email, targetPrice: Number(target), productSlug });
          setSubmitting(false);
        }}
      >
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
        <Button
          type="submit"
          variant="secondary"
          className="mt-2 bg-white text-primary hover:bg-white/90"
          loading={submitting}
        >
          Crear alerta
        </Button>
        <span className="text-center text-2xs opacity-75">
          Podés cancelar en cualquier momento. No mandamos spam.
        </span>
      </form>
    </section>
  );
}
