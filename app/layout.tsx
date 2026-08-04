import type { Metadata } from "next";
import "./globals.css";
import { ClientShell } from "@/components/client-shell";
import { getPreferences } from "@/lib/preferences";
import { siteUrl } from "@/lib/site";
export const metadata: Metadata = { metadataBase: new URL(siteUrl), title: { default: "Juan Sued - Desenvolvedor Full Stack Web & Mobile", template: "%s | Juan Sued" }, description: "Desenvolvedor Full Stack especializado em React, React Native, TypeScript, Node.js e NestJS." };
export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { const preferences = await getPreferences(); return <html lang={preferences.locale === "pt" ? "pt-BR" : "en"} data-theme={preferences.theme}><body><ClientShell {...preferences}>{children}</ClientShell></body></html>; }
