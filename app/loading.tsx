export default function Loading() {
  return <main id="content" aria-busy="true" aria-live="polite">
    <div className="route-progress" aria-hidden="true"/>
    <span className="sr-only">Carregando… / Loading…</span>
    <div className="shell py-14 md:py-20" aria-hidden="true">
      <div className="skeleton h-4 w-40"/>
      <div className="skeleton mt-5 h-12 w-full max-w-2xl"/>
      <div className="skeleton mt-3 h-12 w-full max-w-xl"/>
      <div className="skeleton mt-8 h-5 w-full max-w-lg"/>
      <div className="skeleton mt-3 h-5 w-full max-w-md"/>
      <div className="mt-12 grid gap-4 md:grid-cols-2">
        {[0, 1, 2, 3].map(item => <div key={item} className="card p-6"><div className="skeleton h-4 w-24"/><div className="skeleton mt-4 h-6 w-3/4"/><div className="skeleton mt-3 h-4 w-full"/><div className="skeleton mt-2 h-4 w-5/6"/></div>)}
      </div>
    </div>
  </main>;
}
