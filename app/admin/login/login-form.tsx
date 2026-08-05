"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
export function LoginForm() { const router = useRouter(); const [error, setError] = useState(false); const [loading, setLoading] = useState(false); async function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); setLoading(true); setError(false); const form = new FormData(event.currentTarget); const { error } = await createClient().auth.signInWithPassword({ email: String(form.get("email")), password: String(form.get("password")) }); if (error) { setError(true); setLoading(false); return; } router.replace("/admin"); router.refresh(); } return <Card><CardHeader><h1 className="text-2xl font-semibold">Entrar</h1><p className="mt-2 text-sm text-[var(--muted)]">Acesso restrito ao painel administrativo.</p></CardHeader><CardContent><form className="grid gap-4" onSubmit={submit}>{error && <Alert>Não foi possível entrar. Verifique suas credenciais.</Alert>}<div className="grid gap-2"><Label htmlFor="email">E-mail</Label><Input id="email" name="email" type="email" autoComplete="email" required/></div><div className="grid gap-2"><Label htmlFor="password">Senha</Label><Input id="password" name="password" type="password" autoComplete="current-password" required/></div><Button disabled={loading}>{loading ? "Entrando..." : "Entrar"}</Button></form></CardContent></Card>; }
