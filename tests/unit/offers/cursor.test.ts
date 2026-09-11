import { describe, expect, it } from "vitest";
import { decodeCursor, encodeCursor } from "@/lib/cursor";

describe("cursor (F008)", () => {
  it("roundtrip encode/decode", () => {
    const c = { score: 0.812, id: "cxyz123" };
    const enc = encodeCursor(c);
    expect(typeof enc).toBe("string");
    expect(decodeCursor(enc)).toEqual(c);
  });

  it("null y string inválido → null", () => {
    expect(decodeCursor(null)).toBeNull();
    expect(decodeCursor(undefined)).toBeNull();
    expect(decodeCursor("")).toBeNull();
    expect(decodeCursor("not-base64")).toBeNull();
  });

  it("json válido pero shape incorrecto → null", () => {
    const bad = Buffer.from(JSON.stringify({ score: "no" }), "utf8").toString("base64url");
    expect(decodeCursor(bad)).toBeNull();
  });

  it("cursor no es sensible al orden de campos", () => {
    const a = encodeCursor({ score: 1, id: "a" });
    const b = encodeCursor({ id: "a", score: 1 } as never);
    expect(decodeCursor(a)).toEqual(decodeCursor(b));
  });
});
