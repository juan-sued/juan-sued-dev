"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
export function SetupForm({ token }: { token: string }) { const [error, setError] = useState(false); const [done, setDone] = useState(false); async function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); const { error } = await createClient().auth.signUp({ email: String(form.get("email")), password: String(form.get("password")), options: { emailRedirectTo: `${window.location.origin}/admin/login`, data: { admin_invite_token: token } } }); if (error) { setError(true); return; } setDone(true); } return <Card><CardHeader><h1 className="text-2xl font-semibold">Criar administrador</h1></CardHeader><CardContent>{done ? <p role="status">Cadastro concluído. Confirme o e-mail recebido antes de entrar.</p> : <form onSubmit={submit} className="grid gap-4">{error && <Alert>Não foi possível concluir cadastro. Verifique o link e tente novamente.</Alert>}<div className="grid gap-2"><Label htmlFor="email">E-mail</Label><Input id="email" name="email" type="email" required autoComplete="email"/></div><div className="grid gap-2"><Label htmlFor="password">Senha</Label><Input id="password" name="password" type="password" minLength={8} required autoComplete="new-password"/></div><Button>Criar conta</Button></form>}</CardContent></Card>; }
