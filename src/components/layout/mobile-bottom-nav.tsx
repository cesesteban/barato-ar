"use client";

import { Bell, Home, MapPin, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { ZonePicker } from "@/components/domain/zone-picker";

const LINK_ITEMS = [
  { href: "/", icon: Home, label: "Inicio" },
  { href: "/buscar", icon: Search, label: "Buscar" },
  { href: "/mis-alertas", icon: Bell, label: "Alertas" },
] as const;

export function MobileBottomNav() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-[var(--z-sticky)] flex justify-around border-t border-border bg-surface pb-safe pt-2 md:hidden"
      aria-label="Navegación móvil"
    >
      {LINK_ITEMS.map(({ href, icon: Icon, label }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-1 text-2xs font-medium",
              active ? "text-primary" : "text-text-subtle",
            )}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="size-5" aria-hidden />
            {label}
          </Link>
        );
      })}
      <ZonePicker
        trigger={
          <button
            type="button"
            className="flex flex-1 flex-col items-center gap-0.5 py-1 text-2xs font-medium text-text-subtle"
            aria-label="Cambiar zona"
          >
            <MapPin className="size-5" aria-hidden />
            Zona
          </button>
        }
      />
    </nav>
  );
}
