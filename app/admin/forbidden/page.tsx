import Link from "next/link";
export const metadata = { robots: { index: false, follow: false } };
export default function Forbidden() { return <main className="grid min-h-screen place-items-center p-6"><div><h1 className="text-2xl font-semibold">Acesso negado</h1><Link href="/" className="mt-4 inline-block underline">Voltar ao portfólio</Link></div></main>; }
