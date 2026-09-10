import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/layout";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardBody,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Chip,
  Input,
  Label,
  RadioGroup,
  RadioGroupItem,
  Skeleton,
  Switch,
} from "@/components/ui";
import {
  AlertCard,
  ChainBadge,
  ConsultarBadge,
  DealCard,
  DealCardCompact,
  DiscountBadge,
  ExpiredBadge,
  PriceComparisonRow,
  PriceHistoryChart,
  PriceTag,
  PromoBadge,
  SearchBar,
  ZoneChip,
} from "@/components/domain";
import { NeighborsToggleClient } from "./_client";

// Página oculta de dev — visible sólo en desarrollo para eyeballear el sistema.
export default function ComponentsGalleryPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <PageShell hideMobileNav>
      <div className="mx-auto max-w-6xl px-6 py-12">
        <header className="mb-8 flex flex-col gap-2">
          <span className="text-2xs font-semibold uppercase tracking-wider text-primary">
            /dev/components
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight">Design system</h1>
          <p className="text-text-muted">
            Todos los primitives y domain components de Feature 002. Solo dev.
          </p>
        </header>

        <Section title="Buttons">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="link">Link</Button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
            <Button loading>Loading</Button>
            <Button disabled>Disabled</Button>
          </div>
        </Section>

        <Section title="Badges & Chips">
          <div className="flex flex-wrap items-center gap-3">
            <Badge>neutral</Badge>
            <Badge variant="primary">primary</Badge>
            <Badge variant="savings">-31% ↓</Badge>
            <Badge variant="discount">-31%</Badge>
            <Badge variant="warning">warning</Badge>
            <Badge variant="info">info</Badge>
            <Badge variant="outline">outline</Badge>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Chip>Neutral</Chip>
            <Chip variant="selected">Selected</Chip>
            <Chip variant="primary">Primary</Chip>
            <Chip variant="primary" onRemove={() => {}}>
              Removable
            </Chip>
          </div>
        </Section>

        <Section title="Domain — Prices">
          <div className="flex flex-wrap items-end gap-6">
            <PriceTag amount={890} previousAmount={1290} pricePerUnit={{ value: 395, unit: "L" }} size="md" />
            <PriceTag amount={2450} previousAmount={3200} pricePerUnit={{ value: 2722, unit: "L" }} size="lg" />
            <PriceTag amount={0} />
            <div className="flex items-center gap-3">
              <DiscountBadge pct={31} />
              <ExpiredBadge daysAgo={3} />
              <ConsultarBadge />
            </div>
            <div className="flex items-center gap-3">
              <PromoBadge type="nx1" buyQty={2} />
              <PromoBadge type="nxm" buyQty={3} payQty={2} />
              <PromoBadge type="second_off" secondDiscountPct={70} />
              <PromoBadge type="bundle_discount" buyQty={3} secondDiscountPct={20} />
            </div>
          </div>
        </Section>

        <Section title="Chains">
          <div className="flex flex-wrap gap-2">
            {["carrefour", "coto", "dia", "jumbo", "vea", "disco", "farmacity", "pedidosya", "rappi"].map(
              (c) => (
                <ChainBadge key={c} slug={c} />
              ),
            )}
          </div>
        </Section>

        <Section title="Forms">
          <div className="grid max-w-md gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="demo-email">Email</Label>
              <Input id="demo-email" type="email" placeholder="vos@ejemplo.com" />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="demo-check" />
              <Label htmlFor="demo-check">Acepto los términos</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="demo-sw" defaultChecked />
              <Label htmlFor="demo-sw">Notificaciones</Label>
            </div>
            <RadioGroup defaultValue="a">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="a" id="ra" />
                <Label htmlFor="ra">Opción A</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="b" id="rb" />
                <Label htmlFor="rb">Opción B</Label>
              </div>
            </RadioGroup>
          </div>
        </Section>

        <Section title="Cards & Alerts">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Card title</CardTitle>
                <CardDescription>Descripción secundaria.</CardDescription>
              </CardHeader>
              <CardBody>Contenido del card.</CardBody>
            </Card>
            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Elevated card</CardTitle>
              </CardHeader>
              <CardBody>Con shadow.</CardBody>
            </Card>
          </div>
          <div className="mt-4 grid gap-3">
            <Alert variant="info">
              <AlertTitle>Info</AlertTitle>
              <AlertDescription>Mensaje informativo.</AlertDescription>
            </Alert>
            <Alert variant="success">
              <AlertTitle>OK</AlertTitle>
              <AlertDescription>Todo bien.</AlertDescription>
            </Alert>
            <Alert variant="warning">
              <AlertTitle>Atención</AlertTitle>
              <AlertDescription>Revisar.</AlertDescription>
            </Alert>
            <Alert variant="error">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>Algo salió mal.</AlertDescription>
            </Alert>
          </div>
        </Section>

        <Section title="SearchBar & ZoneChip">
          <SearchBar zoneLabel="Palermo" className="max-w-2xl" />
          <div className="mt-4">
            <ZoneChip zoneLabel="Palermo, CABA" />
          </div>
          <div className="mt-4 max-w-md">
            <NeighborsToggleClient />
          </div>
        </Section>

        <Section title="Deal cards">
          <div className="grid gap-4 md:grid-cols-3">
            <DealCard
              product={{
                slug: "coca-cola-2-25l",
                name: "Coca-Cola Original 2.25L Retornable",
                brand: "Coca-Cola",
              }}
              price={890}
              previousPrice={1290}
              discountPct={31}
              chainSlug="carrefour"
              pricePerUnit={{ value: 395, unit: "L" }}
              promo={{ type: "unit" }}
              validUntilLabel="Válida hasta 12/09"
              distanceKm={0.8}
              href="/producto/coca-cola-2-25l"
            />
            <DealCard
              product={{
                slug: "aceite-natura-900",
                name: "Aceite Natura Girasol 900ml",
                brand: "Natura",
              }}
              price={2450}
              previousPrice={3200}
              discountPct={23}
              chainSlug="coto"
              pricePerUnit={{ value: 2722, unit: "L" }}
              promo={{ type: "second_off", secondDiscountPct: 70 }}
              validUntilLabel="Válida hasta 14/09"
              distanceKm={1.5}
              href="/producto/aceite-natura-900ml"
            />
            <DealCard
              product={{
                slug: "papel-elite-x4",
                name: "Papel Higiénico Elite Doble Hoja x4",
                brand: "Elite",
              }}
              price={1290}
              previousPrice={1690}
              discountPct={24}
              chainSlug="jumbo"
              promo={{ type: "nxm", buyQty: 3, payQty: 2 }}
              validUntilLabel="Válida hasta 13/09"
              distanceKm={2.1}
              expiredDaysAgo={2}
              href="/producto/papel-elite-x4"
            />
          </div>
          <div className="mt-4 grid gap-3 md:max-w-md">
            <DealCardCompact
              product={{ slug: "coca-cola-2-25l", name: "Coca-Cola Original 2.25L" }}
              price={890}
              previousPrice={1290}
              discountPct={31}
              chainSlug="carrefour"
              validUntilLabel="Válida hasta 12/09"
              distanceKm={0.8}
              href="/producto/coca-cola-2-25l"
            />
          </div>
        </Section>

        <Section title="Comparison table">
          <Card padding="none">
            <PriceComparisonRow
              rank={1}
              storeName="Carrefour Palermo"
              storeAddress="Av. Santa Fe 3253"
              chainSlug="carrefour"
              price={890}
              previousPrice={1290}
              deltaVsAvgPct={-31}
              distanceKm={0.8}
              href="#"
              best
            />
            <PriceComparisonRow
              rank={2}
              storeName="Día Palermo Hollywood"
              storeAddress="Honduras 5240"
              chainSlug="dia"
              price={980}
              deltaVsAvgPct={-24}
              distanceKm={1.2}
              href="#"
            />
            <PriceComparisonRow
              rank={3}
              storeName="Coto Palermo"
              storeAddress="Av. Coronel Díaz 1615"
              chainSlug="coto"
              price={1050}
              deltaVsAvgPct={-19}
              distanceKm={1.5}
              promo={{ type: "nx1", buyQty: 2 }}
              href="#"
            />
          </Card>
        </Section>

        <Section title="Alert card & History chart">
          <div className="grid gap-4 md:grid-cols-2">
            <AlertCard productSlug="coca-cola-2-25l" currentPrice={890} />
            <Card variant="default" padding="md">
              <CardHeader>
                <CardTitle>Historial 90 días</CardTitle>
                <CardDescription>Promedio zonal · placeholder de F002</CardDescription>
              </CardHeader>
              <PriceHistoryChart
                data={[
                  { day: "2026-06-12", avgPrice: 1180 },
                  { day: "2026-06-26", avgPrice: 1200 },
                  { day: "2026-07-10", avgPrice: 1150 },
                  { day: "2026-07-24", avgPrice: 1120 },
                  { day: "2026-08-07", avgPrice: 1050 },
                  { day: "2026-08-21", avgPrice: 980 },
                  { day: "2026-09-04", avgPrice: 890 },
                ]}
              />
            </Card>
          </div>
        </Section>

        <Section title="Skeleton">
          <div className="flex items-center gap-3">
            <Skeleton className="size-12 rounded-full" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </Section>

        <div className="mt-16 text-center">
          <Link href="/" className="text-sm text-primary hover:underline">
            ← Volver al home
          </Link>
        </div>
      </div>
    </PageShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10 border-b border-border pb-8 last:border-b-0">
      <h2 className="mb-4 text-lg font-bold tracking-tight text-text">{title}</h2>
      {children}
    </section>
  );
}
