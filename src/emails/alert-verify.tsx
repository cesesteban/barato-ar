import * as React from "react";
import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from "@react-email/components";

// React import above evita "React is not defined" cuando el componente se
// renderiza fuera del contexto de Next (ej. `pnpm alerts:scan` con tsx).
void React;

export type AlertVerifyEmailProps = {
  productName: string;
  targetPrice: string;
  verifyUrl: string;
};

export function AlertVerifyEmail({ productName, targetPrice, verifyUrl }: AlertVerifyEmailProps) {
  return (
    <Html lang="es-AR">
      <Head />
      <Preview>Confirmá tu alerta de precio en Barato.ar</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Heading style={styles.h1}>Confirmá tu alerta</Heading>
          <Text style={styles.p}>
            Vamos a avisarte cuando <strong>{productName}</strong> baje de <strong>{targetPrice}</strong> en tu zona.
          </Text>
          <Section style={{ textAlign: "center", margin: "24px 0" }}>
            <Button style={styles.button} href={verifyUrl}>
              Confirmar alerta
            </Button>
          </Section>
          <Text style={styles.pSmall}>
            El link vence en 24 horas. Si no fuiste vos, ignorá este email.
          </Text>
          <Text style={styles.footer}>Barato.ar · Comparador de ofertas · Argentina</Text>
        </Container>
      </Body>
    </Html>
  );
}

const styles = {
  body: { backgroundColor: "#f8fafc", fontFamily: "Inter,system-ui,sans-serif" },
  container: { maxWidth: "560px", margin: "0 auto", padding: "40px 24px", backgroundColor: "#ffffff", borderRadius: "12px" },
  h1: { fontSize: "24px", fontWeight: 700, color: "#0f172a", margin: "0 0 12px" },
  p: { fontSize: "15px", color: "#0f172a", lineHeight: 1.5 },
  pSmall: { fontSize: "13px", color: "#64748b", lineHeight: 1.5, marginTop: "16px" },
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
