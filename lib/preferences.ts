import { cookies } from "next/headers";
import type { Locale } from "@/content/data";
export type Preferences = { locale: Locale; theme: "light" | "dark"; recruiter: boolean };
export async function getPreferences(): Promise<Preferences> { const store = await cookies(); return { locale: store.get("juan-locale")?.value === "en" ? "en" : "pt", theme: store.get("juan-theme")?.value === "dark" ? "dark" : "light", recruiter: store.get("juan-recruiter")?.value === "true" }; }
