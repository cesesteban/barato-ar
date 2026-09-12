import { describe, expect, it } from "vitest";
import {
  SepaProductoRowSchema,
  SepaSucursalSchema,
  SepaComercioSchema,
} from "@/ingestion/pcl/schemas";

describe("PCL Zod schemas (F004 · SEPA real)", () => {
  it("Sucursal con lat/lng string se coerce a número", () => {
    const parsed = SepaSucursalSchema.parse({
      id_comercio: "10",
      id_bandera: "1",
      id_sucursal: "c-palermo-01",
      sucursales_nombre: "Carrefour Palermo",
      sucursales_calle: "Av. Santa Fe",
      sucursales_numero: "3253",
      sucursales_barrio: "Palermo",
      sucursales_localidad: "CABA",
      sucursales_provincia: "CABA",
      sucursales_latitud: "-34.5875",
      sucursales_longitud: "-58.4300",
    });
    expect(parsed.id_comercio).toBe(10);
    expect(parsed.id_bandera).toBe(1);
    expect(parsed.sucursales_latitud).toBeCloseTo(-34.5875);
  });

  it("Sucursal con campos vacíos → optional undefined", () => {
    const parsed = SepaSucursalSchema.parse({
      id_comercio: "2",
      id_bandera: "1",
      id_sucursal: "x",
      sucursales_provincia: "Tierra del Fuego",
      sucursales_nombre: "",
      sucursales_localidad: "",
      sucursales_latitud: "NA",
    });
    expect(parsed.sucursales_nombre).toBeUndefined();
    expect(parsed.sucursales_latitud).toBeUndefined();
  });

  it("Producto fila real: descripción + precio_lista", () => {
    const parsed = SepaProductoRowSchema.parse({
      id_comercio: "10",
      id_bandera: "1",
      id_sucursal: "c-palermo-01",
      id_producto: "7790895000119",
      productos_ean: "7790895000119",
      productos_descripcion: "Coca-Cola Original 2.25L Retornable",
      productos_marca: "Coca-Cola",
      productos_cantidad_presentacion: "2.25",
      productos_unidad_medida_presentacion: "L",
      productos_precio_lista: "1290.50",
    });
    expect(parsed.productos_descripcion).toBe("Coca-Cola Original 2.25L Retornable");
    expect(parsed.productos_precio_lista).toBe(1290.5);
    expect(parsed.productos_cantidad_presentacion).toBe(2.25);
  });

  it("Precio con coma decimal es-AR parsea", () => {
    const parsed = SepaProductoRowSchema.parse({
      id_comercio: "10",
      id_bandera: "1",
      id_sucursal: "c-palermo-01",
      id_producto: "7790000000000",
      productos_descripcion: "X",
      productos_precio_lista: "1290,50",
    });
    expect(parsed.productos_precio_lista).toBe(1290.5);
  });

  it("Precio con miles + decimal es-AR ('1.290,50') parsea", () => {
    const parsed = SepaProductoRowSchema.parse({
      id_comercio: "10",
      id_bandera: "1",
      id_sucursal: "c-palermo-01",
      id_producto: "7790000000000",
      productos_descripcion: "X",
      productos_precio_lista: "1.290,50",
    });
    expect(parsed.productos_precio_lista).toBe(1290.5);
  });

  it("Comercio con id + razón social", () => {
    const parsed = SepaComercioSchema.parse({
      id_comercio: "9",
      id_bandera: "3",
      comercio_razon_social: "Cencosud S.A.",
      comercio_bandera_nombre: "Jumbo",
    });
    expect(parsed.id_comercio).toBe(9);
    expect(parsed.id_bandera).toBe(3);
    expect(parsed.comercio_bandera_nombre).toBe("Jumbo");
  });
});
