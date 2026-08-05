import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdmin } from "@/lib/auth/admin";
import { LoginForm } from "./login-form";
export default async function AdminLogin() { if (await getAdmin()) redirect("/admin"); return <main className="grid min-h-screen place-items-center p-6"><section className="w-full max-w-md"><p className="mb-4 text-sm font-bold text-[var(--brand)]">JUAN SUED - ADMIN</p><LoginForm/><Link href="/" className="mt-6 inline-block text-sm underline underline-offset-4">Voltar ao portfólio</Link></section></main>; }
