import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useSession } from "@/lib/auth";
import { useMyBookings, useMyMatches } from "@/lib/padel";
import { cancelBooking } from "@/lib/booking.functions";
import { euros } from "@/lib/slots";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Your Padel Dashboard — PadelBase" },
      {
        name: "description",
        content: "Your padel profile, level progress, upcoming court bookings and latest match results in one place.",
      },
      { property: "og:title", content: "Your Padel Dashboard — PadelBase" },
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

function DashboardPage() {
  const { data: session } = useSession();
  const { data: bookings = [] } = useMyBookings(session?.userId);
  const { data: matches = [] } = useMyMatches(session?.userId);
  const queryClient = useQueryClient();
  const cancel = useServerFn(cancelBooking);

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
  const upcoming = bookings.filter((b) => b.status !== "cancelled" && new Date(b.starts_at).getTime() > now);
  const wins = matches.filter((m) => m.result === "WIN").length;
  const level = session?.level ?? 3;
  const progress = Math.round((level % 1) * 100) || Math.min(100, matches.length * 8);

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
            {session?.style ?? "Baseline"} · Level {level.toFixed(1)} · {matches.length} matches
          </div>
          <div className="mt-6 max-w-md">
            <div className="flex justify-between font-mono text-xs mb-1">
              <span>Level progress</span>
              <span>{progress}%</span>
            </div>
            <div className="h-4 bg-sand/15">
              <div className="h-full bg-court transition-[width] duration-700" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-3 max-w-md">
            {[
              { v: wins, l: "Wins" },
              { v: matches.length - wins, l: "Losses" },
              { v: upcoming.length, l: "Upcoming" },
            ].map((s) => (
              <div key={s.l} className="border-2 border-sand/30 p-3">
                <div className="font-display font-black text-3xl leading-none">{s.v}</div>
                <div className="font-mono text-[10px] uppercase tracking-wide text-sand/60 mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

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
