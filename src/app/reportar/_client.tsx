"use client";

import { useState } from "react";
import { Button, Input, Label } from "@/components/ui";

export type ReportFormProps = {
  chains: Array<{ slug: string; name: string }>;
};

type State = { status: "idle" } | { status: "submitting" } | { status: "success"; msg: string } | { status: "error"; msg: string };

export function ReportForm({ chains }: ReportFormProps) {
  const [state, setState] = useState<State>({ status: "idle" });
  const [productText, setProductText] = useState("");
  const [chainSlug, setChainSlug] = useState(chains[0]?.slug ?? "");
  const [storeText, setStoreText] = useState("");
  const [price, setPrice] = useState("");
  const [previousPrice, setPreviousPrice] = useState("");
  const [description, setDescription] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!productText || !chainSlug || !price) return;
    setState({ status: "submitting" });
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          productText,
          chainSlug,
          storeText: storeText || undefined,
          price: Number(price),
          previousPrice: previousPrice ? Number(previousPrice) : undefined,
          description: description || undefined,
        }),
      });
      if (res.status === 429) {
        setState({ status: "error", msg: "Demasiados reportes. Probá más tarde." });
        return;
      }
      if (!res.ok) {
        setState({ status: "error", msg: "No pudimos guardar el reporte." });
        return;
      }
      const data = (await res.json()) as { message?: string };
      setState({ status: "success", msg: data.message ?? "¡Gracias!" });
      // Reset campos
      setProductText("");
      setStoreText("");
      setPrice("");
      setPreviousPrice("");
      setDescription("");
    } catch {
      setState({ status: "error", msg: "Sin conexión. Reintentá." });
    }
  }

  if (state.status === "success") {
    return (
      <div className="flex flex-col gap-2">
        <span className="text-2xl">✅</span>
        <p className="text-lg font-semibold">{state.msg}</p>
        <button
          type="button"
          onClick={() => setState({ status: "idle" })}
          className="mt-2 text-sm text-primary hover:underline"
        >
          Reportar otra
        </button>
      </div>
    );
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={submit}>
      <div className="flex flex-col gap-1">
        <Label htmlFor="product">Producto *</Label>
        <Input
          id="product"
          value={productText}
          onChange={(e) => setProductText(e.target.value)}
          placeholder="Ej: Coca-Cola 2.25L Retornable"
          required
          minLength={2}
          maxLength={200}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <Label htmlFor="chain">Cadena *</Label>
          <select
            id="chain"
            required
            value={chainSlug}
            onChange={(e) => setChainSlug(e.target.value)}
            className="h-9 rounded-[var(--radius)] border border-border bg-surface px-3 text-sm text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
          >
            {chains.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="store">Sucursal (opcional)</Label>
          <Input
            id="store"
            value={storeText}
            onChange={(e) => setStoreText(e.target.value)}
            placeholder="Ej: Palermo Hollywood"
            maxLength={200}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <Label htmlFor="price">Precio actual *</Label>
          <div className="flex items-center rounded-[var(--radius)] border border-border bg-surface pl-3">
            <span className="text-sm text-text-muted">$</span>
            <Input
              id="price"
              type="number"
              min={0.01}
              step={0.01}
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="890"
              className="border-0 focus-visible:outline-none"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="previous">Precio anterior (opcional)</Label>
          <div className="flex items-center rounded-[var(--radius)] border border-border bg-surface pl-3">
            <span className="text-sm text-text-muted">$</span>
            <Input
              id="previous"
              type="number"
              min={0.01}
              step={0.01}
              value={previousPrice}
              onChange={(e) => setPreviousPrice(e.target.value)}
              placeholder="1290"
              className="border-0 focus-visible:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="description">Descripción (opcional)</Label>
        <textarea
          id="description"
          maxLength={500}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Detalles adicionales — hasta cuándo vale, si aplica con tarjeta, etc."
          className="min-h-[100px] rounded-[var(--radius)] border border-border bg-surface p-3 text-sm text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
        />
      </div>

      {state.status === "error" ? (
        <div className="rounded-[var(--radius)] border border-discount bg-discount-soft p-3 text-sm text-discount">
          {state.msg}
        </div>
      ) : null}

      <Button type="submit" loading={state.status === "submitting"}>
        Enviar reporte
      </Button>
    </form>
  );
}
