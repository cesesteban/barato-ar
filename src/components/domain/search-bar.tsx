"use client";

import { MapPin, Search } from "lucide-react";
import { forwardRef, type HTMLAttributes, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";

/**
 * SearchBar base (F002). El autocomplete y las sugerencias populares llegan
 * con Feature 006 — el componente ya expone slots para dropdown y zone chip.
 */
export type SearchBarProps = HTMLAttributes<HTMLFormElement> & {
  placeholder?: string;
  zoneLabel?: string;
  onSearch?: (query: string) => void;
  compact?: boolean;
  inputProps?: InputHTMLAttributes<HTMLInputElement>;
  onChangeZone?: () => void;
};

export const SearchBar = forwardRef<HTMLFormElement, SearchBarProps>(function SearchBar(
  {
    placeholder = "Buscá un producto: 'coca 2.25', 'aceite', 'yerba'...",
    zoneLabel,
    onSearch,
    compact,
    className,
    inputProps,
    onChangeZone,
    ...props
  },
  ref,
) {
  return (
    <form
      ref={ref}
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        const value = new FormData(e.currentTarget).get("q");
        onSearch?.(typeof value === "string" ? value : "");
      }}
      className={cn(
        "flex items-center gap-2 rounded-2xl border border-border bg-surface p-2 shadow-sm",
        compact ? "shadow-none" : "shadow-md",
        className,
      )}
      {...props}
    >
      <label htmlFor="search-q" className="sr-only">
        Buscar producto
      </label>
      <div className="flex flex-1 items-center gap-2 pl-3">
        <Search className="size-4 text-text-subtle" aria-hidden />
        <input
          id="search-q"
          name="q"
          type="search"
          placeholder={placeholder}
          className={cn(
            "flex-1 bg-transparent text-sm text-text outline-none placeholder:text-text-subtle",
            compact ? "py-1" : "py-2",
          )}
          {...inputProps}
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
    </form>
  );
});
