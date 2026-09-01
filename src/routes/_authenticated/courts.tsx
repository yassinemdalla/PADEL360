import { Suspense, lazy, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useClubs, useDayOccupancy } from "@/lib/padel";
import { createBooking } from "@/lib/booking.functions";
import { HOURS, euros, formatHour, slotEnd, slotStart, todayLabel } from "@/lib/slots";
import type { ClubPin } from "@/components/ClubMap";

const ClubMap = lazy(() => import("@/components/ClubMap"));

export const Route = createFileRoute("/_authenticated/courts")({
  head: () => ({
    meta: [
      { title: "Book a Padel Court Nearby — PadelBase" },
      {
        name: "description",
        content: "See live court availability on the map at nearby padel clubs and reserve your slot in a couple of taps.",
      },
      { property: "og:title", content: "Book a Padel Court Nearby — PadelBase" },
      { property: "og:description", content: "Live availability and instant booking at padel clubs near you." },
    ],
  }),
  component: CourtsPage,
});

function dayOffsetDate(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  d.setHours(0, 0, 0, 0);
  return d;
}

function CourtsPage() {
  const [dayOffset, setDayOffset] = useState(0);
  const [clubId, setClubId] = useState<string | null>(null);
  const [selected, setSelected] = useState<{ courtId: string; hour: number } | null>(null);
  const queryClient = useQueryClient();
  const book = useServerFn(createBooking);

  const day = useMemo(() => dayOffsetDate(dayOffset), [dayOffset]);
  const { data: clubs = [], isLoading } = useClubs();
  const activeClub = clubs.find((c) => c.id === clubId) ?? clubs[0] ?? null;

  const allCourtIds = useMemo(() => clubs.flatMap((c) => c.courts.map((ct) => ct.id)), [clubs]);
  const { data: occupancy } = useDayOccupancy(allCourtIds, day);

  const taken = useMemo(() => {
    const set = new Set<string>();
    const add = (courtId: string, s: string, e: string) => {
      const start = new Date(s).getTime();
      const end = new Date(e).getTime();
      for (const h of HOURS) {
        const hs = slotStart(day, h).getTime();
        const he = slotEnd(day, h).getTime();
        if (hs < end && he > start) set.add(`${courtId}:${h}`);
      }
    };
    occupancy?.bookings.forEach((b) => add(b.court_id, b.starts_at, b.ends_at));
    occupancy?.blocks.forEach((b) => add(b.court_id, b.starts_at, b.ends_at));
    return set;
  }, [occupancy, day]);

  const pins: ClubPin[] = clubs
    .filter((c) => c.latitude != null && c.longitude != null)
    .map((c) => {
      const total = c.courts.length * HOURS.length;
      const free = c.courts.reduce(
        (acc, ct) => acc + HOURS.filter((h) => !taken.has(`${ct.id}:${h}`)).length,
        0,
      );
      return {
        id: c.id,
        name: c.name,
        latitude: c.latitude!,
        longitude: c.longitude!,
        address: c.address,
        freeSlots: free,
        totalSlots: total,
      };
    });

  const mutation = useMutation({
    mutationFn: async (input: { courtId: string; startsAt: string }) =>
      book({ data: { courtId: input.courtId, startsAt: input.startsAt, durationMinutes: 60 } }),
    onSuccess: (res) => {
      setSelected(null);
      queryClient.invalidateQueries({ queryKey: ["occupancy"] });
      queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
      toast.success(`Reserved ${res.clubName} · ${res.courtName}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="min-h-screen w-full bg-sand text-ink flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="bg-ink text-sand border-b-4 border-court">
          <div className="max-w-6xl mx-auto px-6 py-12">
            <div className="font-mono text-xs uppercase tracking-[0.25em] text-court mb-4">
              /// {todayLabel(day)}
            </div>
            <h1 className="font-display font-black uppercase tracking-tighter text-5xl md:text-7xl leading-[0.85]">
              Book a
              <br />
              <span className="text-clay">Court.</span>
            </h1>
            <div className="mt-8 flex flex-wrap gap-2 font-mono text-xs uppercase tracking-widest">
              {[0, 1, 2, 3, 4, 5, 6].map((o) => (
                <button
                  key={o}
                  onClick={() => {
                    setDayOffset(o);
                    setSelected(null);
                  }}
                  className={`border-2 px-3 py-1.5 ${
                    o === dayOffset ? "bg-court text-ink border-court font-bold" : "border-sand/40 text-sand"
                  }`}
                >
                  {o === 0
                    ? "Today"
                    : dayOffsetDate(o).toLocaleDateString(undefined, { weekday: "short", day: "numeric" })}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-6 py-12 space-y-6">
          <div className="slab-thick bg-sand">
            <div className="bg-ink text-sand px-5 py-3 flex items-center justify-between">
              <h2 className="font-display font-black uppercase tracking-tight text-xl">Clubs Near You</h2>
              <span className="font-mono text-xs">Pin number = free slots</span>
            </div>
            <div className="h-[340px] border-b-2 border-ink">
              <Suspense fallback={<div className="h-full grid place-items-center font-mono text-xs">Loading map…</div>}>
                {pins.length > 0 && (
                  <ClubMap pins={pins} activeId={activeClub?.id ?? null} onSelect={(id) => setClubId(id)} />
                )}
              </Suspense>
            </div>
            <div className="grid sm:grid-cols-3">
              {clubs.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setClubId(c.id);
                    setSelected(null);
                  }}
                  className={`text-left p-4 border-r-2 border-ink last:border-r-0 ${
                    c.id === activeClub?.id ? "bg-ink text-sand" : "bg-sand"
                  }`}
                >
                  <div className="font-display font-black text-lg leading-none">{c.name}</div>
                  <div className="font-mono text-xs opacity-70 mt-1">
                    {c.location_label} · {c.courts.length} courts · {euros(c.price_cents)}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {isLoading && <div className="font-mono text-xs uppercase tracking-widest">Loading clubs…</div>}

          {activeClub && (
            <div className="slab-thick bg-sand">
              <div className="bg-court text-ink px-5 py-3 flex items-center justify-between gap-3">
                <h2 className="font-display font-black uppercase tracking-tight text-xl">{activeClub.name}</h2>
                <Link
                  to="/clubs/$clubId"
                  params={{ clubId: activeClub.id }}
                  className="font-mono text-xs underline underline-offset-4"
                >
                  Club profile
                </Link>
              </div>
              <div className="p-5 space-y-6">
                {activeClub.description && (
                  <p className="font-mono text-xs text-ink/70 leading-relaxed max-w-2xl">{activeClub.description}</p>
                )}
                {activeClub.courts.map((court) => (
                  <div key={court.id}>
                    <div className="flex items-baseline justify-between mb-2">
                      <div className="font-display font-black uppercase text-lg">{court.name}</div>
                      <div className="font-mono text-[10px] uppercase tracking-widest text-ink/60">
                        {court.surface}
                        {court.description ? ` · ${court.description}` : ""}
                      </div>
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                      {HOURS.map((h) => {
                        const isTaken = taken.has(`${court.id}:${h}`);
                        const past = slotStart(day, h).getTime() <= Date.now();
                        const active = selected?.courtId === court.id && selected.hour === h;
                        const disabled = isTaken || past;
                        return (
                          <button
                            key={h}
                            disabled={disabled}
                            onClick={() => setSelected({ courtId: court.id, hour: h })}
                            className={`slab font-mono text-xs py-3 ${
                              disabled
                                ? "bg-ink/10 text-ink/30 line-through cursor-not-allowed"
                                : active
                                  ? "bg-court font-bold"
                                  : "bg-sand hover:bg-court/40"
                            }`}
                          >
                            {formatHour(h)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-ink pt-4">
                  <div className="font-mono text-xs text-ink/70">
                    {selected
                      ? `${activeClub.courts.find((c) => c.id === selected.courtId)?.name} · ${formatHour(selected.hour)} · ${euros(activeClub.price_cents)}`
                      : "Pick a slot to reserve"}
                  </div>
                  <button
                    disabled={!selected || mutation.isPending}
                    onClick={() =>
                      selected &&
                      mutation.mutate({
                        courtId: selected.courtId,
                        startsAt: slotStart(day, selected.hour).toISOString(),
                      })
                    }
                    className={`font-display px-6 py-3 text-sm ${
                      selected && !mutation.isPending
                        ? "btn-ink"
                        : "bg-ink/10 text-ink/40 font-bold uppercase cursor-not-allowed"
                    }`}
                  >
                    {mutation.isPending ? "Reserving…" : "Reserve"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
