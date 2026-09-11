"use client";

import { MapPin, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import type { AutocompleteResponse } from "@/server/search/schemas";

export type SearchBarProps = {
  placeholder?: string;
  zoneLabel?: string;
  compact?: boolean;
  className?: string;
  defaultValue?: string;
  onChangeZone?: () => void;
};

const DEBOUNCE_MS = 200;
const MIN_QUERY = 2;

export const SearchBar = forwardRef<HTMLFormElement, SearchBarProps>(function SearchBar(
  { placeholder = "Buscá un producto: 'coca 2.25', 'aceite', 'yerba'...", zoneLabel, compact, className, defaultValue = "", onChangeZone },
  ref,
) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const [value, setValue] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<AutocompleteResponse | null>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    const q = value.trim();
    if (q.length < MIN_QUERY) {
      setSuggestions(null);
      setActiveIndex(-1);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/autocomplete?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = (await res.json()) as AutocompleteResponse;
        setSuggestions(data);
        setActiveIndex(-1);
      } catch (err) {
        if ((err as Error).name !== "AbortError") console.warn("[search-bar] autocomplete:", err);
      }
    }, DEBOUNCE_MS);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [value]);

  const flatItems = flatten(suggestions);

  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const q = value.trim();
      if (q.length < MIN_QUERY) return;
      router.push(`/buscar?q=${encodeURIComponent(q)}`);
      setOpen(false);
    },
    [router, value],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (!flatItems.length) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % flatItems.length);
        setOpen(true);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + flatItems.length) % flatItems.length);
        setOpen(true);
      } else if (e.key === "Enter") {
        const item = flatItems[activeIndex];
        if (item) {
          e.preventDefault();
          router.push(item.href);
          setOpen(false);
        }
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    },
    [activeIndex, flatItems, router],
  );

  return (
    <form
      ref={ref}
      role="search"
      onSubmit={handleSubmit}
      className={cn(
        "relative flex items-center gap-2 rounded-2xl border border-border bg-surface p-2 shadow-sm",
        compact ? "shadow-none" : "shadow-md",
        className,
      )}
    >
      <label htmlFor="search-q" className="sr-only">
        Buscar producto
      </label>
      <div className="flex flex-1 items-center gap-2 pl-3">
        <Search className="size-4 text-text-subtle" aria-hidden />
        <input
          id="search-q"
          ref={inputRef}
          name="q"
          type="search"
          value={value}
          placeholder={placeholder}
          onChange={(e) => {
            setValue(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          onKeyDown={handleKeyDown}
          role="combobox"
          aria-expanded={open && flatItems.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
          autoComplete="off"
          className={cn(
            "flex-1 bg-transparent text-sm text-text outline-none placeholder:text-text-subtle",
            compact ? "py-1" : "py-2",
          )}
        />
      </div>
      {zoneLabel ? (
        <button
          type="button"
          onClick={onChangeZone}
          className="hidden items-center gap-1.5 border-l border-border pl-3 pr-2 text-sm font-medium text-text-muted hover:text-text sm:flex"
          aria-label={`Zona ${zoneLabel}. Cambiar.`}
        >
          <MapPin className="size-4" aria-hidden />
          {zoneLabel}
        </button>
      ) : null}
      <Button type="submit" size="md" className="rounded-[var(--radius)]">
        Buscar
      </Button>

      {open && flatItems.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-full z-[var(--z-dropdown)] mt-2 max-h-96 overflow-y-auto rounded-[var(--radius-lg)] border border-border bg-surface shadow-lg"
        >
          {flatItems.map((item, i) => (
            <li
              key={`${item.kind}-${item.href}`}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              className={cn(
                "flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-sm hover:bg-surface-muted",
                i === activeIndex && "bg-surface-muted",
              )}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                router.push(item.href);
                setOpen(false);
              }}
            >
              <span className="flex items-center gap-2">
                <span className="text-2xs uppercase tracking-wider text-text-subtle">{item.kindLabel}</span>
                <span>{item.label}</span>
              </span>
              {item.count ? <span className="text-2xs text-text-subtle">{item.count}</span> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </form>
  );
});

type FlatItem = {
  kind: "product" | "brand" | "category";
  kindLabel: string;
  label: string;
  href: string;
  count?: number;
};

function flatten(data: AutocompleteResponse | null): FlatItem[] {
  if (!data) return [];
  const items: FlatItem[] = [];
  for (const p of data.products) {
    items.push({ kind: "product", kindLabel: "Producto", label: p.label, href: `/producto/${p.slug}` });
  }
  for (const b of data.brands) {
    items.push({
      kind: "brand",
      kindLabel: "Marca",
      label: b.label,
      href: `/buscar?q=${encodeURIComponent(b.label)}`,
      count: b.count,
    });
  }
  for (const c of data.categories) {
    items.push({
      kind: "category",
      kindLabel: "Categoría",
      label: c.label,
      href: `/buscar?q=${encodeURIComponent(c.slug)}`,
      count: c.count,
    });
  }
  return items;
}
