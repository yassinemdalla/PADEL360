import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarPlus, MapPin, Search } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { LevelProgress } from "@/components/LevelBadge";
import { useSession } from "@/lib/auth";
import { useMyBookings, useMyMatches } from "@/lib/padel";
import { formatDateTime, formatTimeRange } from "@/lib/slots";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({
    meta: [
      { title: "Your Padel Home — Next Match & Booking | PADEL360" },
      {
        name: "description",
        content:
          "See your next padel booking and match, then find a game, book a court in Sousse or create a new match in one tap.",
      },
      { property: "og:title", content: "Your Padel Home — PADEL360" },
      { property: "og:description", content: "Your next booking, your next match, and quick actions to play." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { data: session } = useSession();
  const { data: bookings = [] } = useMyBookings(session?.userId);
  const { data: matches = [] } = useMyMatches(session?.userId);

  const now = Date.now();
  const nextBooking = [...bookings]
    .filter((b) => b.status !== "cancelled" && new Date(b.ends_at).getTime() > now)
    .sort((a, b) => +new Date(a.starts_at) - +new Date(b.starts_at))[0];
  const nextMatch = [...matches]
    .filter((m) => new Date(m.ends_at).getTime() > now)
    .sort((a, b) => +new Date(a.starts_at) - +new Date(b.starts_at))[0];

  return (
    <AppShell>
      <h1 className="text-3xl font-black tracking-tight">
        Hey {session?.displayName.split(" ")[0] ?? "player"} 👋
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">Find a game, book a court, log the win.</p>

      {session && (
        <div className="card-surface mt-5 p-4">
          <LevelProgress tier={session.tier} points={session.points} />
        </div>
      )}

      <div className="mt-5 grid grid-cols-3 gap-3">
        {[
          { to: "/matches", label: "Find match", icon: Search },
          { to: "/clubs", label: "Book court", icon: MapPin },
          { to: "/matches/new", label: "Create match", icon: CalendarPlus },
        ].map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} className="card-surface flex flex-col items-center gap-2 px-2 py-4 text-center">
            <span className="grid size-10 place-items-center rounded-full bg-accent text-accent-foreground">
              <Icon className="size-5" />
            </span>
            <span className="text-xs font-bold">{label}</span>
          </Link>
        ))}
      </div>

      <section className="mt-7">
        <h2 className="text-lg font-black">Next booking</h2>
        {nextBooking ? (
          <div className="card-surface mt-3 p-4">
            <p className="font-bold">
              {nextBooking.courts?.clubs?.name} · {nextBooking.courts?.name}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatDateTime(nextBooking.starts_at)} · {formatTimeRange(nextBooking.starts_at, nextBooking.ends_at)}
            </p>
            <span className="chip mt-3 bg-accent text-accent-foreground">Confirmed</span>
          </div>
        ) : (
          <p className="card-surface mt-3 p-4 text-sm text-muted-foreground">
            No upcoming court booking.{" "}
            <Link to="/clubs" className="font-semibold text-foreground underline">
              Book one
            </Link>
            .
          </p>
        )}
      </section>

      <section className="mt-7">
        <h2 className="text-lg font-black">Next match</h2>
        {nextMatch ? (
          <Link to="/matches/$matchId" params={{ matchId: nextMatch.id }} className="card-surface mt-3 block p-4">
            <p className="font-bold">{nextMatch.clubs?.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatDateTime(nextMatch.starts_at)} · {nextMatch.match_players.length}/{nextMatch.max_players} players
            </p>
          </Link>
        ) : (
          <p className="card-surface mt-3 p-4 text-sm text-muted-foreground">
            You're not in an upcoming match.{" "}
            <Link to="/matches" className="font-semibold text-foreground underline">
              Find one
            </Link>
            .
          </p>
        )}
      </section>
    </AppShell>
  );
}
