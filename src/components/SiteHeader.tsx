import { Link } from "@tanstack/react-router";
import { profile } from "@/lib/padel-data";

const links = [
  { to: "/", label: "Play" },
  { to: "/matches", label: "Matches" },
  { to: "/players", label: "Players" },
  { to: "/courts", label: "Courts" },
] as const;

export function SiteHeader() {
  return (
    <header className="bg-ink text-sand border-b-4 border-court">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3">
          <div className="size-9 bg-court grid place-items-center">
            <span className="font-display font-black text-ink text-lg">P</span>
          </div>
          <span className="font-display font-black text-xl tracking-tight uppercase">PadelBase</span>
        </Link>
        <nav className="hidden md:flex items-center gap-7 font-mono text-xs uppercase tracking-widest">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: l.to === "/" }}
              activeProps={{ className: "bg-court text-ink px-2 py-1" }}
              inactiveProps={{ className: "px-2 py-1 hover:bg-court hover:text-ink" }}
            >
              {l.label}
            </Link>
          ))}
          <Link
            to="/manager"
            className="border-2 border-court px-3 py-1 font-bold"
            activeProps={{ className: "bg-court text-ink" }}
          >
            Club Manager
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <div className="size-9 bg-clay grid place-items-center font-mono text-xs font-bold">
            {profile.initials}
          </div>
        </div>
      </div>
      <nav className="md:hidden flex items-stretch border-t-2 border-sand/20 font-mono text-[10px] uppercase tracking-widest">
        {[...links, { to: "/manager", label: "Manager" } as const].map((l) => (
          <Link
            key={l.to}
            to={l.to}
            activeOptions={{ exact: l.to === "/" }}
            className="flex-1 text-center py-2"
            activeProps={{ className: "bg-court text-ink font-bold" }}
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
