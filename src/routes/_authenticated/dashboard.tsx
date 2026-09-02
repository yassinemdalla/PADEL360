import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useSession } from "@/lib/auth";
import { useMyBookings, useMyMatches, type MyBooking } from "@/lib/padel";
import { cancelBooking, logMatchFromBooking } from "@/lib/booking.functions";
import { euros } from "@/lib/slots";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Your Padel Dashboard — PADEL360" },
      {
        name: "description",
        content: "Your padel profile, level progress, upcoming court bookings and latest match results in one place.",
      },
      { property: "og:title", content: "Your Padel Dashboard — PADEL360" },
      { property: "og:description", content: "Level progress, bookings and match results at a glance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});

function fmt(date: string) {
  return new Date(date).toLocaleString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function LogMatchForm({ booking, onDone }: { booking: MyBooking; onDone: () => void }) {
  const [opponent, setOpponent] = useState("");
  const [score, setScore] = useState("");
  const [result, setResult] = useState<"WIN" | "LOSS">("WIN");
  const queryClient = useQueryClient();
  const logMatch = useServerFn(logMatchFromBooking);

  const mutation = useMutation({
    mutationFn: () =>
      logMatch({ data: { bookingId: booking.id, opponent: opponent.trim(), score: score.trim(), result } }),
    onSuccess: () => {
      toast.success("Match added to your history");
      queryClient.invalidateQueries({ queryKey: ["my-matches"] });
      queryClient.invalidateQueries({ queryKey: ["session"] });
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate();
      }}
      className="mt-3 border-t-2 border-ink pt-3 space-y-2"
    >
      <input
        value={opponent}
        onChange={(e) => setOpponent(e.target.value)}
        required
        minLength={2}
        placeholder="Opponent pair"
        className="w-full border-2 border-ink bg-sand px-2 py-1.5 font-mono text-xs"
      />
      <input
        value={score}
        onChange={(e) => setScore(e.target.value)}
        required
        minLength={3}
        placeholder="Score e.g. 6-4 7-5"
        className="w-full border-2 border-ink bg-sand px-2 py-1.5 font-mono text-xs"
      />
      <div className="flex gap-2">
        {(["WIN", "LOSS"] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setResult(r)}
            className={`flex-1 font-mono text-[10px] uppercase tracking-widest border-2 border-ink py-1.5 ${
              result === r ? (r === "WIN" ? "bg-court text-ink" : "bg-clay text-sand border-clay") : ""
            }`}
          >
            {r}
          </button>
        ))}
      </div>
      <button
        type="submit"
        disabled={mutation.isPending}
        className="btn-court font-display w-full py-2 text-xs disabled:opacity-50"
      >
        {mutation.isPending ? "Saving…" : "Save match"}
      </button>
    </form>
  );
}

function DashboardPage() {
  const { data: session } = useSession();
  const { data: bookings = [] } = useMyBookings(session?.userId);
  const { data: matches = [] } = useMyMatches(session?.userId);
  const queryClient = useQueryClient();
  const cancel = useServerFn(cancelBooking);
  const [logging, setLogging] = useState<string | null>(null);

  const cancelMutation = useMutation({
    mutationFn: (bookingId: string) => cancel({ data: { bookingId } }),
    onSuccess: () => {
      toast.success("Booking cancelled");
      queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["occupancy"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const now = Date.now();
  const active = bookings.filter((b) => b.status !== "cancelled");
  const upcoming = active.filter((b) => new Date(b.starts_at).getTime() > now);
  const past = active.filter((b) => new Date(b.ends_at).getTime() <= now).slice(0, 6);

  const wins = matches.filter((m) => m.result === "WIN").length;
  const losses = matches.length - wins;
  const winRate = matches.length ? Math.round((wins / matches.length) * 100) : 0;
  const level = session?.level ?? 3;
  const levelProgress = Math.round((level % 1) * 100);

  return (
    <div className="min-h-screen w-full bg-sand text-ink flex flex-col">
      <SiteHeader />

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10 space-y-8">
        <div className="slab-thick bg-ink text-sand p-6">
          <div className="font-mono text-xs uppercase tracking-[0.25em] text-court">Player profile</div>
          <h1 className="font-display font-black uppercase tracking-tighter text-5xl md:text-6xl leading-none mt-3">
            {session?.displayName ?? "Player"}
          </h1>
          <div className="font-mono text-xs text-sand/60 mt-2">
            {session?.style ?? "Baseline"} · Level {level.toFixed(2)} · {matches.length} matches
          </div>
        </div>

        <section>
          <h2 className="font-display font-black uppercase tracking-tighter text-3xl leading-none mb-4">
            Progress tracker
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { v: matches.length, l: "Matches played" },
              { v: wins, l: "Wins" },
              { v: losses, l: "Losses" },
              { v: level.toFixed(2), l: "Current level" },
            ].map((s) => (
              <div key={s.l} className="slab p-4 bg-sand">
                <div className="font-display font-black text-4xl leading-none">{s.v}</div>
                <div className="font-mono text-[10px] uppercase tracking-wide text-ink/60 mt-1">{s.l}</div>
              </div>
            ))}
          </div>
          <div className="slab p-5 bg-sand mt-4 space-y-4">
            <div>
              <div className="flex justify-between font-mono text-xs mb-1">
                <span>Win rate</span>
                <span>{winRate}%</span>
              </div>
              <div className="h-4 border-2 border-ink">
                <div className="h-full bg-court transition-[width] duration-700" style={{ width: `${winRate}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between font-mono text-xs mb-1">
                <span>
                  Level {Math.floor(level)} → {Math.floor(level) + 1}
                </span>
                <span>{levelProgress}%</span>
              </div>
              <div className="h-4 border-2 border-ink">
                <div className="h-full bg-clay transition-[width] duration-700" style={{ width: `${levelProgress}%` }} />
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-end justify-between mb-4">
            <h2 className="font-display font-black uppercase tracking-tighter text-3xl leading-none">Your bookings</h2>
            <Link to="/courts" className="btn-court font-display px-4 py-2 text-xs">
              Book a court
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <div className="slab p-6 font-mono text-sm text-ink/60">
              No upcoming bookings yet. Grab a slot from the courts page.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcoming.map((b) => (
                <div key={b.id} className="slab p-4 bg-sand">
                  <div className="font-mono text-xs text-ink/60">{fmt(b.starts_at)}</div>
                  <div className="font-display font-black text-xl mt-1 leading-none">
                    {b.courts?.clubs?.name ?? "Club"}
                  </div>
                  <div className="font-mono text-xs text-ink/60 mt-1">
                    {b.courts?.name} · {b.courts?.clubs?.location_label}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="font-display font-black text-lg">{euros(b.price_cents)}</span>
                    <button
                      onClick={() => cancelMutation.mutate(b.id)}
                      disabled={cancelMutation.isPending}
                      className="font-mono text-[10px] uppercase tracking-widest border-2 border-ink px-2 py-1.5 hover:bg-clay hover:text-sand hover:border-clay"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="font-display font-black uppercase tracking-tighter text-3xl leading-none mb-4">
            Played — log your result
          </h2>
          {past.length === 0 ? (
            <div className="slab p-6 font-mono text-sm text-ink/60">
              Once a booked slot finishes it shows up here so you can log the match result.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {past.map((b) => (
                <div key={b.id} className="slab p-4 bg-sand">
                  <div className="font-mono text-xs text-ink/60">{fmt(b.starts_at)}</div>
                  <div className="font-display font-black text-xl mt-1 leading-none">
                    {b.courts?.clubs?.name ?? "Club"}
                  </div>
                  <div className="font-mono text-xs text-ink/60 mt-1">{b.courts?.name}</div>
                  {logging === b.id ? (
                    <LogMatchForm booking={b} onDone={() => setLogging(null)} />
                  ) : (
                    <button
                      onClick={() => setLogging(b.id)}
                      className="mt-3 w-full font-mono text-[10px] uppercase tracking-widest border-2 border-ink py-2 hover:bg-court"
                    >
                      Log result
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-end justify-between mb-4">
            <h2 className="font-display font-black uppercase tracking-tighter text-3xl leading-none">Recent matches</h2>
            <Link to="/matches" className="font-mono text-xs uppercase tracking-widest text-ink/50 hover:text-ink">
              All matches
            </Link>
          </div>
          {matches.length === 0 ? (
            <div className="slab p-6 font-mono text-sm text-ink/60">No matches recorded yet.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {matches.slice(0, 5).map((m) => (
                <div key={m.id} className="slab p-4 bg-sand">
                  <div className="font-mono text-xs text-ink/60">
                    {new Date(m.played_on).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                  </div>
                  <div className="font-display font-black text-lg mt-1">{m.opponent}</div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="font-display font-black text-2xl">{m.score}</span>
                    <span
                      className={`font-mono text-xs font-bold px-2 py-0.5 ${
                        m.result === "WIN" ? "bg-court text-ink" : "bg-clay text-sand"
                      }`}
                    >
                      {m.result}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
