/**
 * Auth.js v5 setup (C-010).
 * EmailProvider vía Resend SMTP. Solo gatea /admin/*.
 */

import NextAuth from "next-auth";
import Nodemailer from "next-auth/providers/nodemailer";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./db";
import { env } from "./env";

// Auth.js v5-beta tiene un mismatch entre NodemailerConfig y el union Provider
// bajo `exactOptionalPropertyTypes`. El cast es el workaround estándar para v5
// mientras la beta se estabiliza. Se puede quitar cuando `next-auth@5` salga
// stable con los tipos ajustados.
const emailProvider = Nodemailer({
  server: `smtp://resend:${env.RESEND_API_KEY ?? ""}@smtp.resend.com:465`,
  from: "Barato.ar <admin@barato.ar>",
}) as unknown as Parameters<typeof NextAuth>[0] extends { providers: infer P }
  ? P extends readonly (infer E)[]
    ? E
    : never
  : never;

export const { auth, signIn, signOut, handlers } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [emailProvider],
  pages: {
    signIn: "/admin/signin",
  },
  callbacks: {
    authorized({ auth, request }) {
      const path = request.nextUrl.pathname;
      if (path.startsWith("/admin")) {
        const email = auth?.user?.email?.toLowerCase();
        return !!email && env.ADMIN_EMAILS.has(email);
      }
      return true;
    },
  },
  session: { strategy: "database" },
});
