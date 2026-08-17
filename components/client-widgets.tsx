"use client";

import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/locale";
import { track } from "@/lib/analytics";
import { toast } from "sonner";

type TurnstileOptions = {
  sitekey: string;
  callback: (token: string) => void;
  "error-callback": () => void;
  "expired-callback": () => void;
};

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: TurnstileOptions) => string;
      reset: (widgetId?: string) => void;
      remove?: (widgetId: string) => void;
    };
  }
}

const turnstileScript = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

export function Lab({ locale }: { locale: Locale }) {
  const [state, setState] = useState(0);
  const states = locale === "pt"
    ? [["Pendente", "Captura guardada localmente, aguardando conexão."], ["Enviando", "Fila sendo sincronizada com serviço remoto."], ["Tentando novamente", "Falha temporária; nova tentativa agendada."], ["Confirmado", "Processamento confirmado e fila atualizada."]]
    : [["Pending", "Capture stored locally, waiting for connection."], ["Sending", "Queue synchronizing with remote service."], ["Retrying", "Temporary failure; another attempt is scheduled."], ["Confirmed", "Processing confirmed and queue updated."]];

  return <div className="card p-6" aria-label={locale === "pt" ? "Simulação de fila offline" : "Offline queue simulation"}>
    <p className="font-semibold">{locale === "pt" ? "Simulação de fila offline" : "Offline queue simulation"}</p>
    <div className="mt-6 grid gap-3 sm:grid-cols-4">{states.map(([name], index) => <button key={name} onClick={() => setState(index)} aria-pressed={state === index} className={`rounded-lg border p-4 text-left ${state === index ? "border-[var(--brand)] bg-[var(--brand-soft)]" : "border-[var(--line)]"}`}><span aria-hidden="true" className="text-xs text-[var(--muted)]">0{index + 1}</span><strong className="mt-2 block">{name}</strong></button>)}</div>
    <p aria-live="polite" className="mt-5 text-sm text-[var(--muted)]"><strong>{states[state][0]}: </strong>{states[state][1]}</p>
  </div>;
}

export function ContactForm({ locale }: { locale: Locale }) {
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [challengeError, setChallengeError] = useState(false);
  const challengeRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | undefined>(undefined);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const isProduction = process.env.NODE_ENV === "production";
  const label = locale === "pt"
    ? { name: "Nome", message: "Mensagem", action: "Enviar mensagem", feedback: "Mensagem enviada. Obrigado pelo contato!", invalid: "Revise os campos obrigatórios.", error: "Não foi possível enviar. Tente novamente.", challenge: "Conclua a verificação antes de enviar.", challengeError: "Verificação indisponível. Tente novamente." }
    : { name: "Name", message: "Message", action: "Send message", feedback: "Message sent. Thank you for reaching out!", invalid: "Review required fields.", error: "Unable to send. Please try again.", challenge: "Complete verification before sending.", challengeError: "Verification unavailable. Try again." };

  useEffect(() => {
    if (!siteKey) return;

    let cancelled = false;
    const render = () => {
      if (cancelled || !challengeRef.current || !window.turnstile || widgetId.current) return;
      widgetId.current = window.turnstile.render(challengeRef.current, {
        sitekey: siteKey,
        callback: token => { if (!cancelled) { setTurnstileToken(token); setChallengeError(false); } },
        "error-callback": () => { if (!cancelled) { setTurnstileToken(null); setChallengeError(true); setFeedback(label.challengeError); } },
        "expired-callback": () => { if (!cancelled) { setTurnstileToken(null); setFeedback(label.challenge); } },
      });
    };
    const script = document.querySelector<HTMLScriptElement>('script[data-turnstile="true"]') ?? document.createElement("script");
    const onError = () => { if (!cancelled) { setChallengeError(true); setFeedback(label.challengeError); } };

    script.addEventListener("load", render);
    script.addEventListener("error", onError);
    if (!script.parentNode) {
      script.src = turnstileScript;
      script.async = true;
      script.dataset.turnstile = "true";
      document.head.append(script);
    }
    render();

    return () => {
      cancelled = true;
      script.removeEventListener("load", render);
      script.removeEventListener("error", onError);
      if (widgetId.current) window.turnstile?.remove?.(widgetId.current);
      widgetId.current = undefined;
    };
  }, [isProduction, label.challenge, label.challengeError, siteKey]);

  const resetChallenge = () => {
    setTurnstileToken(null);
    if (widgetId.current) window.turnstile?.reset(widgetId.current);
  };

  return <form onSubmit={async event => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const message = String(form.get("message") ?? "").trim();
    if (name.length < 2 || message.length < 10 || !/^\S+@\S+\.\S+$/.test(email)) { setFeedback(label.invalid); return; }
    if (isProduction && !siteKey) { setFeedback(label.challengeError); return; }
    if (siteKey && (!turnstileToken || challengeError)) { setFeedback(challengeError ? label.challengeError : label.challenge); resetChallenge(); return; }

    setLoading(true);
    try {
      const response = await fetch("/api/contact", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name, email, message, sourcePath: window.location.pathname, honeypot: "", turnstileToken: turnstileToken ?? undefined }) });
      if (!response.ok) { setFeedback(label.error); toast.error(label.error); resetChallenge(); return; }
      formElement.reset();
      resetChallenge();
      track("email_click", { source: "form" });
      setFeedback(label.feedback);
      toast.success(label.feedback);
    } catch {
      setFeedback(label.error);
      toast.error(label.error);
      resetChallenge();
    } finally {
      setLoading(false);
    }
  }} className="card grid gap-3 p-5">
    <label htmlFor="contact-name" className="text-sm font-bold">{label.name}</label>
    <input id="contact-name" name="name" required minLength={2} maxLength={80} autoComplete="name" className="-mt-2 rounded-lg border border-[var(--line)] bg-transparent p-3" />
    <label htmlFor="contact-email" className="text-sm font-bold">E-mail</label>
    <input id="contact-email" name="email" required type="email" maxLength={120} autoComplete="email" className="-mt-2 rounded-lg border border-[var(--line)] bg-transparent p-3" />
    <label htmlFor="contact-message" className="text-sm font-bold">{label.message}</label>
    <textarea id="contact-message" name="message" required minLength={10} maxLength={2000} className="-mt-2 min-h-32 rounded-lg border border-[var(--line)] bg-transparent p-3" />
    {siteKey ? <div ref={challengeRef} aria-label="Cloudflare Turnstile" /> : !isProduction ? <p className="text-sm text-[var(--muted)]">Turnstile disabled in development: form submits without a token.</p> : null}
    <button type="submit" disabled={loading || (isProduction && !siteKey)} className="rounded-lg bg-[var(--brand)] px-4 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-60">{loading ? "..." : label.action}</button>
    {(feedback || (isProduction && !siteKey)) && <p role="status" aria-live="polite" className="text-sm">{feedback || label.challengeError}</p>}
  </form>;
}
