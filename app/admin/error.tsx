"use client";

export default function AdminError({ reset }: { reset: () => void }) {
  return <main className="p-4 md:p-8"><h1 className="text-2xl font-bold">Não foi possível carregar administração</h1><p className="mt-2 text-sm text-[var(--muted)]">Tente novamente.</p><button type="button" onClick={reset} className="mt-4 rounded-lg bg-[var(--brand)] px-3 py-2 font-semibold text-white">Tentar novamente</button></main>;
}
