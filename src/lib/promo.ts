/**
 * Precio efectivo por unidad considerando combos (C-001).
 */

import Decimal from "decimal.js";

export type PromoInputs = {
  price: number;                     // precio unitario listado
  promoType: "unit" | "nx1" | "nxm" | "second_off" | "bundle_discount";
  promoBuyQty?: number | null;
  promoPayQty?: number | null;
  promoSecondDiscountPct?: number | null;
};

/**
 * Devuelve el precio EFECTIVO por unidad tras aplicar la promo.
 * Ej: 3x2 de $1000 → $667 por unidad.
 */
export function computeEffectivePrice(inputs: PromoInputs): number {
  const price = new Decimal(inputs.price);
  switch (inputs.promoType) {
    case "unit":
      return price.toDecimalPlaces(2).toNumber();

    case "nx1": {
      const buy = new Decimal(inputs.promoBuyQty ?? 2);
      if (buy.lte(0)) return price.toDecimalPlaces(2).toNumber();
      return price.div(buy).toDecimalPlaces(4).toNumber();
    }

    case "nxm": {
      const buy = new Decimal(inputs.promoBuyQty ?? 3);
      const pay = new Decimal(inputs.promoPayQty ?? 2);
      if (buy.lte(0)) return price.toDecimalPlaces(2).toNumber();
      return price.mul(pay).div(buy).toDecimalPlaces(4).toNumber();
    }

    case "second_off": {
      const disc = new Decimal(inputs.promoSecondDiscountPct ?? 0).div(100);
      // Promedio de precio-por-unidad al llevar 2: (1 + (1 - disc)) / 2
      const factor = new Decimal(1).add(new Decimal(1).minus(disc)).div(2);
      return price.mul(factor).toDecimalPlaces(4).toNumber();
    }

    case "bundle_discount": {
      const disc = new Decimal(inputs.promoSecondDiscountPct ?? 0).div(100);
      return price.mul(new Decimal(1).minus(disc)).toDecimalPlaces(4).toNumber();
    }

    default:
      return price.toDecimalPlaces(2).toNumber();
  }
}
