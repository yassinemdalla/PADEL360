export function SiteFooter() {
  return (
    <footer className="bg-court text-ink border-t-4 border-ink">
      <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="font-display font-black uppercase text-2xl tracking-tighter">
          PadelBase — the full court, one app
        </div>
        <div className="font-mono text-xs uppercase tracking-widest">
          © 2026 PadelBase · Built for the court
        </div>
      </div>
    </footer>
  );
}
