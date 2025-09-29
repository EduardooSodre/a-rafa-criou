import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { ConditionalHeader } from "@/components/ConditionalHeader";
import ToastProvider from "@/components/ToastProvider";

/**
 * Contexto do Copilot:
 * E-commerce de PDFs (Next.js, TS, Tailwind, Shadcn, Drizzle, Auth.js).
 * Requisitos: migração WooCommerce, phpass rehash, PDFs privados, cupons,
 * CMS embutido, notificações externas, afiliados, traduções, SEO/301, PWA opcional.
 * Padrões: acessibilidade, idempotência, validação com Zod.
 */

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"], // Weights para acessibilidade
});

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_SITE_TITLE || "A Rafa Criou - E-commerce de PDFs",
  description: process.env.NEXT_PUBLIC_SITE_DESCRIPTION || "Loja online de produtos digitais em PDF com foco em acessibilidade e experiência do usuário.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={process.env.NEXT_PUBLIC_DEFAULT_LOCALE || 'pt'}>
      <body
        className={`${poppins.variable} font-sans antialiased`}
        suppressHydrationWarning={true}
      >
        <Providers>
          <ConditionalHeader />
          <main>
            {children}
          </main>
          <ToastProvider />
        </Providers>
      </body>
    </html>
  );
}
