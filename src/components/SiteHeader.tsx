import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";

const playerLinks = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/matches", label: "Matches" },
  { to: "/players", label: "Players" },
  { to: "/courts", label: "Courts" },
] as const;

const managerLinks = [
  { to: "/manager", label: "Schedule" },
  { to: "/club", label: "Club" },
  { to: "/courts", label: "Courts" },
  { to: "/players", label: "Players" },
] as const;

export function SiteHeader() {
  const { data: session } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const links = session?.role === "club_manager" ? managerLinks : playerLinks;

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="bg-ink text-sand border-b-4 border-court">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
        <Link to={session ? (session.role === "club_manager" ? "/manager" : "/dashboard") : "/"} className="flex items-center gap-3">
          <div className="size-9 bg-court grid place-items-center">
            <span className="font-display font-black text-ink text-lg">P</span>
          </div>
          <span className="font-display font-black text-xl tracking-tight uppercase">PadelBase</span>
        </Link>

        {session && (
          <nav className="hidden md:flex items-center gap-6 font-mono text-xs uppercase tracking-widest">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                activeProps={{ className: "bg-court text-ink px-2 py-1" }}
                inactiveProps={{ className: "px-2 py-1 hover:bg-court hover:text-ink" }}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-2">
          {session ? (
            <>
              <div className="size-9 bg-clay grid place-items-center font-mono text-xs font-bold text-sand">
                {session.initials}
              </div>
              <button
                onClick={signOut}
                className="font-mono text-[10px] uppercase tracking-widest border-2 border-sand/40 px-2 py-1.5 hover:bg-sand hover:text-ink"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link to="/auth" className="btn-court font-display px-4 py-2 text-xs">
              Sign in
            </Link>
          )}
        </div>
      </div>

      {session && (
        <nav className="md:hidden flex items-stretch border-t-2 border-sand/20 font-mono text-[10px] uppercase tracking-widest">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="flex-1 text-center py-2"
              activeProps={{ className: "bg-court text-ink font-bold" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
