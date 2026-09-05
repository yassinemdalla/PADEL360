import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, Home, CalendarDays, MapPin, User, Moon, Sun, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { useNotifications } from "@/lib/padel";
import { LevelBadge } from "@/components/LevelBadge";
import { Padel360Logo } from "@/components/Padel360Logo";

const NAV = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/matches", label: "Matches", icon: CalendarDays },
  { to: "/clubs", label: "Clubs", icon: MapPin },
  { to: "/profile", label: "Profile", icon: User },
] as const;

function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("padel360-theme");
    const prefers = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const next = stored ? stored === "dark" : prefers;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("padel360-theme", next ? "dark" : "light");
  }

  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      className="grid size-9 place-items-center rounded-full bg-secondary text-secondary-foreground"
    >
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const { data: notifications = [] } = useNotifications(session?.userId);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const unread = notifications.filter((n) => !n.read_at).length;

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/home" className="flex items-center gap-2">
            <Padel360Logo />
            <span className="font-display text-lg font-black tracking-tight">PADEL360</span>
          </Link>

          <div className="flex items-center gap-2">
            {session && <LevelBadge tier={session.tier} />}
            <div className="relative">
              <button
                onClick={() => setOpen((v) => !v)}
                aria-label="Notifications"
                className="relative grid size-9 place-items-center rounded-full bg-secondary text-secondary-foreground"
              >
                <Bell className="size-4" />
                {unread > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                    {unread}
                  </span>
                )}
              </button>
              {open && (
                <div className="card-surface absolute right-0 z-40 mt-2 w-80 overflow-hidden p-0">
                  <div className="border-b border-border px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Notifications
                  </div>
                  {notifications.length === 0 ? (
                    <p className="px-4 py-6 text-sm text-muted-foreground">Nothing yet.</p>
                  ) : (
                    <ul className="max-h-80 overflow-auto">
                      {notifications.slice(0, 12).map((n) => (
                        <li key={n.id} className="border-b border-border px-4 py-3 last:border-0">
                          <p className="text-sm font-semibold">{n.title}</p>
                          <p className="text-xs text-muted-foreground">{n.body}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
            <ThemeToggle />
            <button
              onClick={signOut}
              aria-label="Sign out"
              className="grid size-9 place-items-center rounded-full bg-secondary text-secondary-foreground"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-28 pt-5">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-semibold text-muted-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              <Icon className="size-5" />
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
