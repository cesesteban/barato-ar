import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { PriceHistoryChart } from "@/components/domain/price-history-chart";

describe("PriceHistoryChart (F010)", () => {
  it("con 0 puntos → fallback 'sin historial'", () => {
    const { container } = render(<PriceHistoryChart data={[]} />);
    expect(container.textContent).toMatch(/historial/i);
  });
  it("con 1 punto → fallback", () => {
    const { container } = render(<PriceHistoryChart data={[{ day: "2026-09-01", avgPrice: 100 }]} />);
    expect(container.textContent).toMatch(/historial/i);
  });
  it("con 2+ puntos → svg con path", () => {
    const { container } = render(
      <PriceHistoryChart
        data={[
          { day: "2026-09-01", avgPrice: 100 },
          { day: "2026-09-02", avgPrice: 120 },
          { day: "2026-09-03", avgPrice: 110 },
        ]}
      />,
    );
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
    const paths = container.querySelectorAll("path");
    expect(paths.length).toBeGreaterThanOrEqual(2);
  });
});
