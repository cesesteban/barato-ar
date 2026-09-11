import * as React from "react";
import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from "@react-email/components";

void React;

export type AlertTriggeredEmailProps = {
  productName: string;
  currentPrice: string;
  targetPrice: string;
  chainName: string;
  storeName: string;
  productUrl: string;
  unsubscribeUrl: string;
};

export function AlertTriggeredEmail({
  productName,
  currentPrice,
  targetPrice,
  chainName,
  storeName,
  productUrl,
  unsubscribeUrl,
}: AlertTriggeredEmailProps) {
  return (
    <Html lang="es-AR">
      <Head />
      <Preview>
        ¡Bajó! {productName} a {currentPrice} en {chainName}
      </Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Heading style={styles.h1}>¡Bajó a {currentPrice}!</Heading>
          <Text style={styles.p}>
            <strong>{productName}</strong> ahora está en <strong>{currentPrice}</strong> en{" "}
            <strong>{chainName}</strong> ({storeName}).
          </Text>
          <Text style={styles.p}>Tu precio objetivo era {targetPrice}.</Text>
          <Section style={{ textAlign: "center", margin: "24px 0" }}>
            <Button style={styles.button} href={productUrl}>
              Ver oferta
            </Button>
          </Section>
          <Text style={styles.pSmall}>
            Los precios son referenciales y pueden variar. Verificá siempre en la tienda antes de comprar.
          </Text>
          <Text style={styles.footer}>
            ¿No querés más esta alerta?{" "}
            <a href={unsubscribeUrl} style={{ color: "#64748b" }}>
              Cancelar
            </a>
            . · Barato.ar
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const styles = {
  body: { backgroundColor: "#f8fafc", fontFamily: "Inter,system-ui,sans-serif" },
  container: { maxWidth: "560px", margin: "0 auto", padding: "40px 24px", backgroundColor: "#ffffff", borderRadius: "12px" },
  h1: { fontSize: "28px", fontWeight: 800, color: "#10b981", margin: "0 0 12px" },
  p: { fontSize: "15px", color: "#0f172a", lineHeight: 1.5 },
  pSmall: { fontSize: "12px", color: "#64748b", lineHeight: 1.5, marginTop: "12px" },
  button: {
    display: "inline-block",
    backgroundColor: "#4f46e5",
    color: "#ffffff",
    padding: "12px 24px",
    borderRadius: "10px",
    textDecoration: "none",
    fontWeight: 600,
  },
  footer: { fontSize: "11px", color: "#94a3b8", marginTop: "32px", textAlign: "center" as const },
};
