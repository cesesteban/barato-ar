import { describe, expect, it } from "vitest";
import { SepaPrecioSchema, SepaProductoSchema, SepaSucursalSchema } from "@/ingestion/pcl/schemas";

describe("PCL Zod schemas (F004)", () => {
  it("Sucursal válida con lat/lng string", () => {
    const parsed = SepaSucursalSchema.parse({
      id_comercio: "1",
      id_bandera: "1",
      id_sucursal: "c-palermo-01",
      sucursales_nombre: "Carrefour Palermo",
      provincia: "CABA",
      ciudad: "Palermo",
      localidad: "Palermo",
      sucursales_latitud: "-34.5875",
      sucursales_longitud: "-58.4300",
    });
    expect(parsed.id_comercio).toBe(1);
    expect(parsed.sucursales_latitud).toBeCloseTo(-34.5875);
  });

  it("Sucursal con campos vacíos → optional undefined", () => {
    const parsed = SepaSucursalSchema.parse({
      id_comercio: "17",
      id_bandera: "1",
      id_sucursal: "x",
      provincia: "Tierra del Fuego",
      sucursales_nombre: "",
      ciudad: "",
      localidad: "",
      sucursales_latitud: "NA",
    });
    expect(parsed.sucursales_nombre).toBeUndefined();
    expect(parsed.sucursales_latitud).toBeUndefined();
  });

  it("Producto acepta strings vacíos como opcionales", () => {
    const parsed = SepaProductoSchema.parse({
      id_producto: "7790000000000",
      productos_descripcion: "Coca 2.25",
      productos_marca: "",
      productos_presentacion: "2.25 L",
    });
    expect(parsed.productos_marca).toBeUndefined();
    expect(parsed.productos_presentacion).toBe("2.25 L");
  });

  it("Precio con precio_lista punto decimal", () => {
    const parsed = SepaPrecioSchema.parse({
      id_comercio: "1",
      id_bandera: "1",
      id_sucursal: "c-palermo-01",
      id_producto: "7790000000000",
      productos_precio_lista: "1290.50",
      productos_precio_referencia_impuestos_incluidos: "",
      fecha_relevamiento: "2026-09-10",
    });
    expect(parsed.productos_precio_lista).toBe(1290.5);
    expect(parsed.productos_precio_referencia_impuestos_incluidos).toBeUndefined();
  });

  it("Precio con coma decimal es-AR también parsea", () => {
    const parsed = SepaPrecioSchema.parse({
      id_comercio: "1",
      id_bandera: "1",
      id_sucursal: "c-palermo-01",
      id_producto: "7790000000000",
      productos_precio_lista: "1290,50",
    });
    expect(parsed.productos_precio_lista).toBe(1290.5);
  });

  it("Precio con miles + decimal es-AR ('1.290,50')", () => {
    const parsed = SepaPrecioSchema.parse({
      id_comercio: "1",
      id_bandera: "1",
      id_sucursal: "c-palermo-01",
      id_producto: "7790000000000",
      productos_precio_lista: "1.290,50",
    });
    expect(parsed.productos_precio_lista).toBe(1290.5);
  });
});
