"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui";

export function ApproveRejectButtons({ candidateId }: { candidateId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState<"approve" | "reject" | null>(null);

  async function act(action: "approve" | "reject") {
    if (pending) return;
    setPending(action);
    const reason = action === "reject" ? prompt("Motivo del rechazo (opcional):") ?? undefined : undefined;
    try {
      const init: RequestInit = {
        method: "POST",
        headers: { "content-type": "application/json" },
      };
      if (reason) init.body = JSON.stringify({ reason });
      const res = await fetch(`/api/admin/normalizer/candidates/${candidateId}/${action}`, init);
      if (!res.ok) {
        const body = await res.text();
        alert(`Falló: ${body}`);
        setPending(null);
        return;
      }
      router.refresh();
    } finally {
      setPending(null);
    }
  }

  return (
    <>
      <Button variant="secondary" onClick={() => act("reject")} loading={pending === "reject"}>
        Rechazar
      </Button>
      <Button variant="primary" onClick={() => act("approve")} loading={pending === "approve"}>
        Aprobar y mergear
      </Button>
    </>
  );
}
