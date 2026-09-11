/**
 * Envío de email transaccional (F009 + F001 Auth.js).
 *
 * Estrategia:
 *   - `SMTP_URL` seteado → nodemailer con esa URL (dev: MailPit; prod: Resend
 *     smtp://resend:${RESEND_API_KEY}@smtp.resend.com:465, si preferís SMTP).
 *   - Sino, si `RESEND_API_KEY` seteado → HTTPS API de Resend.
 *   - Ninguno → log a consola (dev-fallback; nunca en prod).
 *
 * `from` default: "Barato.ar <alertas@barato.ar>" (C-012).
 */

import nodemailer, { type Transporter } from "nodemailer";
import { env } from "./env";

const DEFAULT_FROM = "Barato.ar <alertas@barato.ar>";

let smtpTransport: Transporter | null = null;

function getSmtpTransport(): Transporter | null {
  if (smtpTransport) return smtpTransport;
  if (!env.SMTP_URL) return null;
  smtpTransport = nodemailer.createTransport(env.SMTP_URL);
  return smtpTransport;
}

export type SendMailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  headers?: Record<string, string>;
};

export type SendMailResult = { messageId: string | null; transport: "smtp" | "resend-api" | "console" };

export async function sendMail(input: SendMailInput): Promise<SendMailResult> {
  const from = input.from ?? DEFAULT_FROM;
  const smtp = getSmtpTransport();
  if (smtp) {
    const info = await smtp.sendMail({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      headers: input.headers,
    });
    return { messageId: info.messageId ?? null, transport: "smtp" };
  }
  if (env.RESEND_API_KEY) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
        headers: input.headers,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Resend HTTP ${res.status}: ${body}`);
    }
    const data = (await res.json()) as { id?: string };
    return { messageId: data.id ?? null, transport: "resend-api" };
  }
  console.warn("[mailer] no hay SMTP_URL ni RESEND_API_KEY — email a consola");
  console.info(`[mailer] TO=${input.to} SUBJ=${input.subject}`);
  return { messageId: null, transport: "console" };
}
