import type { ReactNode } from "react";
import { Nav } from "./nav";
import { Footer } from "./footer";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { TooltipProvider } from "@/components/ui/tooltip";
import { StoreClickTracker } from "@/components/analytics/store-click-tracker";

export type PageShellProps = {
  children: ReactNode;
  zoneLabel?: string | undefined;
  hideFooter?: boolean | undefined;
  hideMobileNav?: boolean | undefined;
};

/** Layout base con Nav + main + Footer + MobileBottomNav + TooltipProvider global. */
export function PageShell({ children, zoneLabel, hideFooter, hideMobileNav }: PageShellProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex min-h-screen flex-col">
        <Nav zoneLabel={zoneLabel} />
        <main className="flex-1 pb-16 md:pb-0" id="main">
          {children}
        </main>
        {!hideFooter ? <Footer /> : null}
        {!hideMobileNav ? <MobileBottomNav /> : null}
        <StoreClickTracker />
      </div>
    </TooltipProvider>
  );
}
