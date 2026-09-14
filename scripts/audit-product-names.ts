/**
 * Analiza calidad de nombres de productos en la DB para F020.
 * Detecta patrones problemáticos comunes: abreviaturas truncadas,
 * separadores crípticos, marcas duplicadas en nombre, chain names.
 */
import { PrismaClient } from "@prisma/client";

async function main() {
  const p = new PrismaClient();

  const total = await p.product.count();
  console.log(`Total productos: ${total}\n`);

  // Patrones problemáticos
  const patterns: Array<{ name: string; regex: string }> = [
    { name: "empieza con 'Carrefour'", regex: "^Carrefour " },
    { name: "empieza con 'Coto'", regex: "^Coto " },
    { name: "empieza con 'Dia'", regex: "^Dia " },
    { name: "'Cerv ' (Cerveza truncada)", regex: "\\bCerv\\b" },
    { name: "'Gaseo' (Gaseosa truncada)", regex: "\\bGaseo\\b" },
    { name: "'Choc ' (Chocolate truncada)", regex: "\\bChoc\\b" },
    { name: "'Alfa ' (Alfajor truncada)", regex: "\\bAlfa\\b" },
    { name: "'Muzzare' (Muzzarella truncada)", regex: "\\bMuzzare\\b" },
    { name: "'Descrem' (Descremada truncada)", regex: "\\bDescrem\\b" },
    { name: "'Semidescre' (Semidescremada truncada)", regex: "\\bSemidescre\\b" },
    { name: "'Rectan' (Rectangular truncada)", regex: "\\bRectan\\b" },
    { name: "' C ' (con truncado)", regex: " C " },
    { name: "' D ' (de truncado)", regex: " D " },
    { name: "' X ' (por truncado)", regex: " X " },
    { name: "'Frut' (Frutas truncada suelta)", regex: "\\bFrut\\b" },
    { name: "'Sab' (Sabor truncada suelta)", regex: "\\bSab\\b" },
  ];

  for (const { name, regex } of patterns) {
    const count = await p.product.count({
      where: { name: { contains: regex, mode: "insensitive" } as never },
    });
    const pct = ((count / total) * 100).toFixed(1);
    console.log(`  ${name}: ${count} (${pct}%)`);
  }

  console.log(`\n=== Marcas ===`);
  const noBrand = await p.product.count({ where: { brand: null } });
  const brandLen4 = await p.product.count({ where: { brand: { in: ["Bulld", "Pesca", "Smack", "Coca", "Dia", "Sancr", "Serene", "Ledesm"] } } });
  console.log(`  sin marca: ${noBrand} (${((noBrand / total) * 100).toFixed(1)}%)`);
  console.log(`  marcas truncadas (Bulld/Pesca/etc): ${brandLen4}`);

  console.log(`\n=== Muestra de 15 productos problemáticos ===`);
  const bad = await p.product.findMany({
    where: {
      OR: [
        { name: { startsWith: "Carrefour " } },
        { name: { contains: "Cerv" } },
        { name: { contains: "Gaseo" } },
        { name: { contains: " C " } },
      ],
    },
    take: 15,
    select: { name: true, brand: true, size: true, unit: true, eanCode: true },
  });
  for (const b of bad) {
    console.log(`  name="${b.name}" | brand=${b.brand ?? "-"} | size=${b.size ?? "-"}${b.unit ?? ""} | ean=${b.eanCode}`);
  }

  console.log(`\n=== Fields de SEPA que NO estamos aprovechando ===`);
  console.log(`  productos_cantidad_presentacion → mapea a Product.size`);
  console.log(`  productos_unidad_medida_presentacion → mapea a Product.unit`);
  console.log(`  productos_marca (raw) → limpiamos con cleanBrand pero descartamos si >4 palabras`);
  console.log(`  productos_descripcion → única fuente del nombre, viene sucia`);

  await p.$disconnect();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
