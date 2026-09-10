import type { ChainParser } from "../../core/types";
import { fetchCarrefourFlyer } from "./fetcher";
import { parseCarrefourFlyer } from "./parser";

export const carrefourParser: ChainParser = {
  chainId: "carrefour",
  fetch: fetchCarrefourFlyer,
  async *parse(raw, sourceUrl) {
    for (const item of parseCarrefourFlyer(raw, sourceUrl)) yield item;
  },
};
