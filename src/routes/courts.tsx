import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { clubs } from "@/lib/padel-data";

export const Route = createFileRoute("/courts")({
  head: () => ({
    meta: [
      { title: "Book a Padel Court Nearby — PadelBase" },
      {
        name: "description",
        content: "See live court availability at nearby padel clubs and reserve your slot in a couple of taps.",
      },
      { property: "og:title", content: "Book a Padel Court Nearby — PadelBase" },
      {
        property: "og:description",
        content: "Live availability and instant booking at padel clubs near you.",
      },
    ],
  }),
  component: CourtsPage,
});

function CourtsPage() {
  const [clubId, setClubId] = useState(clubs[0]!.id);
  const [slot, setSlot] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<string | null>(null);
  const club = clubs.find((c) => c.id === clubId)!;

  return (
    <div className="min-h-screen w-full bg-sand text-ink flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="bg-ink text-sand border-b-4 border-court">
          <div className="max-w-6xl mx-auto px-6 py-12">
            <div className="font-mono text-xs uppercase tracking-[0.25em] text-court mb-4">
              /// Saturday · Today
            </div>
            <h1 className="font-display font-black uppercase tracking-tighter text-5xl md:text-7xl leading-[0.85]">
              Book a
              <br />
              <span className="text-clay">Court.</span>
            </h1>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-6 py-12 grid lg:grid-cols-[1fr_2fr] gap-6 items-start">
          <div className="slab-thick bg-sand">
            <div className="bg-court text-ink px-5 py-3 font-display font-black uppercase tracking-tight text-xl">
              Nearby Clubs
            </div>
            <div className="p-5 space-y-3">
              {clubs.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setClubId(c.id);
                    setSlot(null);
                    setConfirmed(null);
                  }}
                  className={`w-full text-left slab p-3 ${c.id === clubId ? "bg-ink text-sand" : "bg-sand"}`}
                >
                  <div className="font-display font-black text-lg leading-none">{c.name}</div>
                  <div className="font-mono text-xs opacity-70 mt-1">
                    {c.distance} · {c.courts} courts · {c.price}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="slab-thick bg-sand">
            <div className="bg-ink text-sand px-5 py-3 flex items-center justify-between">
              <h2 className="font-display font-black uppercase tracking-tight text-xl">{club.name}</h2>
              <span className="font-mono text-xs">{club.price}</span>
            </div>
            <div className="p-5">
              <div className="font-mono text-xs uppercase tracking-widest text-ink/60 mb-3">
                Available slots · 60 min
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {club.slots.map((s) => {
                  const taken = s.state === "taken";
                  const active = slot === s.time;
                  return (
                    <button
                      key={s.time}
                      disabled={taken}
                      onClick={() => {
                        setSlot(s.time);
                        setConfirmed(null);
                      }}
                      className={`slab font-mono text-xs py-3 transition-transform active:translate-y-0.5 ${
                        taken
                          ? "bg-ink/10 text-ink/30 line-through cursor-not-allowed"
                          : active
                            ? "bg-court font-bold"
                            : "bg-sand hover:bg-court/40"
                      }`}
                    >
                      {s.time}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t-2 border-ink pt-4">
                <div className="font-mono text-xs text-ink/70">
                  {slot ? `Court 2 · ${slot} · ${club.price}` : "Pick a slot to reserve"}
                </div>
                <button
                  disabled={!slot}
                  onClick={() => setConfirmed(slot)}
                  className={`font-display px-6 py-3 text-sm ${
                    slot ? "btn-ink" : "bg-ink/10 text-ink/40 font-bold uppercase cursor-not-allowed"
                  }`}
                >
                  Reserve
                </button>
              </div>

              {confirmed && (
                <div className="mt-4 bg-court text-ink slab p-3 font-mono text-xs uppercase tracking-widest">
                  Reserved · {club.name} · {confirmed}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
