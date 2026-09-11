"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Input } from "@/components/ui";

export function ReportActions({
  reportId,
  suggestedProductSlug,
  suggestedStoreId,
}: {
  reportId: string;
  suggestedProductSlug: string;
  suggestedStoreId: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<"approve" | "reject" | null>(null);
  const [productSlug, setProductSlug] = useState(suggestedProductSlug);
  const [storeId] = useState(suggestedStoreId);

  async function approve() {
    if (pending) return;
    setPending("approve");
    try {
      const res = await fetch(`/api/admin/reports/${reportId}/approve`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          overrideProductSlug: productSlug || undefined,
          overrideStoreId: storeId || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        alert(`Aprobación falló: ${body}`);
      } else {
        router.refresh();
      }
    } finally {
      setPending(null);
    }
  }

  async function reject() {
    if (pending) return;
    const reason = prompt("Motivo del rechazo (opcional):") ?? undefined;
    setPending("reject");
    try {
      const init: RequestInit = {
        method: "POST",
        headers: { "content-type": "application/json" },
      };
      if (reason) init.body = JSON.stringify({ reason });
      const res = await fetch(`/api/admin/reports/${reportId}/reject`, init);
      if (!res.ok) alert("Falló");
      else router.refresh();
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        value={productSlug}
        onChange={(e) => setProductSlug(e.target.value)}
        placeholder="product-slug para aprobar"
        className="w-64"
      />
      <Button variant="secondary" onClick={reject} loading={pending === "reject"}>
        Rechazar
      </Button>
      <Button variant="primary" onClick={approve} loading={pending === "approve"}>
        Aprobar
      </Button>
    </div>
  );
}
