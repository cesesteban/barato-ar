/**
 * Cursor opaco (base64 JSON) para paginación estable (F008).
 */

export type OffersCursor = {
  score: number;
  id: string;
};

export function encodeCursor(c: OffersCursor): string {
  return Buffer.from(JSON.stringify(c), "utf8").toString("base64url");
}

export function decodeCursor(raw: string | null | undefined): OffersCursor | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      typeof parsed.score === "number" &&
      typeof parsed.id === "string"
    ) {
      return parsed as OffersCursor;
    }
    return null;
  } catch {
    return null;
  }
}
