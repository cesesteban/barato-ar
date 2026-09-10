"use client";

import { useState } from "react";
import { NeighborsToggle } from "@/components/domain";

export function NeighborsToggleClient() {
  const [checked, setChecked] = useState(false);
  return <NeighborsToggle checked={checked} onCheckedChange={setChecked} />;
}
