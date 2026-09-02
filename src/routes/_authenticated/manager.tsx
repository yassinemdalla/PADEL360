import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useSession } from "@/lib/auth";
import { useDayOccupancy, useMyClub } from "@/lib/padel";
import { HOURS, euros, formatHour, slotEnd, slotStart, todayLabel } from "@/lib/slots";

export const Route = createFileRoute("/_authenticated/manager")({
  head: () => ({
    meta: [
      { title: "Club Schedule & Bookings — PadelBase Manager" },
      {
        name: "description",
        content: "Manage your padel club: see the day's court schedule, live bookings, manager holds and occupancy at a glance.",
      },
      { property: "og:title", content: "Club Schedule & Bookings — PadelBase Manager" },
      { property: "og:description", content: "Court schedule, bookings and occupancy for your padel club." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ManagerPage,
});

function dayOffsetDate(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  d.setHours(0, 0, 0, 0);
  return d;
}

function ManagerPage() {
  const { data: session } = useSession();
  const { data: club, isLoading } = useMyClub(session?.userId);
  const [dayOffset, setDayOffset] = useState(0);
  const day = useMemo(() => dayOffsetDate(dayOffset), [dayOffset]);

  const courtIds = club?.courts.map((c) => c.id) ?? [];
  const { data: occupancy } = useDayOccupancy(courtIds, day);

  const cellState = (courtId: string, hour: number): "free" | "booked" | "hold" => {
    const hs = slotStart(day, hour).getTime();
    const he = slotEnd(day, hour).getTime();
    const hit = (s: string, e: string) => hs < new Date(e).getTime() && he > new Date(s).getTime();
    if (occupancy?.blocks.some((b) => b.court_id === courtId && hit(b.starts_at, b.ends_at))) return "hold";
    if (occupancy?.bookings.some((b) => b.court_id === courtId && hit(b.starts_at, b.ends_at))) return "booked";
    return "free";
  };

  const totalCells = (club?.courts.length ?? 0) * HOURS.length;
  const bookedCells = club
    ? club.courts.reduce(
        (sum, c) => sum + HOURS.filter((h) => cellState(c.id, h) !== "free").length,
        0,
      )
    : 0;
  const occupancyPct = totalCells ? Math.round((bookedCells / totalCells) * 100) : 0;
  const revenue = (occupancy?.bookings ?? []).reduce((s, b) => s + b.price_cents, 0);

  return (
    <div className="min-h-screen w-full bg-sand text-ink flex flex-col">
      <SiteHeader />

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display font-black uppercase tracking-tighter text-5xl md:text-6xl leading-none">
              {club?.name ?? "Club Manager"}
            </h1>
            <p className="font-mono text-xs text-ink/60 mt-3">{todayLabel(day)}</p>
          </div>
          <Link to="/club" className="btn-ink font-mono text-xs px-4 py-2">
            Edit club profile
          </Link>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {Array.from({ length: 7 }, (_, i) => i).map((offset) => {
            const d = dayOffsetDate(offset);
            return (
              <button
                key={offset}
                onClick={() => setDayOffset(offset)}
                className={`font-mono text-xs uppercase tracking-widest border-2 border-ink px-3 py-2 ${
                  offset === dayOffset ? "bg-ink text-sand" : "hover:bg-court"
                }`}
              >
                {offset === 0 ? "Today" : d.toLocaleDateString(undefined, { weekday: "short", day: "numeric" })}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          {[
            { v: occupancy?.bookings.length ?? 0, l: "Bookings" },
            { v: occupancy?.blocks.length ?? 0, l: "Holds" },
            { v: `${occupancyPct}%`, l: "Occupancy" },
            { v: euros(revenue), l: "Revenue" },
          ].map((s) => (
            <div key={s.l} className="slab p-4 bg-sand">
              <div className="font-display font-black text-3xl leading-none">{s.v}</div>
              <div className="font-mono text-[10px] uppercase tracking-wide text-ink/60 mt-1">{s.l}</div>
            </div>
          ))}
        </div>

        {isLoading ? (
          <div className="mt-8 slab p-6 font-mono text-sm text-ink/60">Loading your club…</div>
        ) : !club ? (
          <div className="mt-8 slab p-6 font-mono text-sm text-ink/60">
            No club is linked to your account yet.
          </div>
        ) : (
          <div className="mt-8 slab-thick bg-sand overflow-x-auto">
            <div className="bg-clay text-sand px-5 py-3 font-mono text-xs uppercase tracking-widest">
              Court schedule
            </div>
            <table className="w-full border-collapse min-w-[600px]">
              <thead>
                <tr>
                  <th className="font-mono text-[10px] uppercase tracking-widest text-ink/60 text-left px-3 py-2">
                    Time
                  </th>
                  {club.courts.map((c) => (
                    <th
                      key={c.id}
                      className="font-mono text-[10px] uppercase tracking-widest text-ink/60 text-left px-3 py-2"
                    >
                      {c.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {HOURS.map((h) => (
                  <tr key={h} className="border-t-2 border-ink">
                    <td className="font-mono text-xs px-3 py-2">{formatHour(h)}</td>
                    {club.courts.map((c) => {
                      const state = cellState(c.id, h);
                      return (
                        <td key={c.id} className="px-3 py-2">
                          <span
                            className={`inline-block w-full font-mono text-[10px] uppercase tracking-widest px-2 py-1.5 ${
                              state === "booked"
                                ? "bg-court text-ink"
                                : state === "hold"
                                  ? "bg-clay text-sand"
                                  : "border-2 border-ink/20 text-ink/50"
                            }`}
                          >
                            {state}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
