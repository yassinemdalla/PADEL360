import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { players, profile } from "@/lib/padel-data";

export const Route = createFileRoute("/players")({
  head: () => ({
    meta: [
      { title: "Discover Padel Players At Your Level — PadelBase" },
      {
        name: "description",
        content: "Find and connect with padel players near you who match your level, playing style and availability.",
      },
      { property: "og:title", content: "Discover Padel Players At Your Level — PadelBase" },
      {
        property: "og:description",
        content: "Level-matched padel partners nearby, ready to play.",
      },
    ],
  }),
  component: PlayersPage,
});

const filters = ["All levels", "My level", "Closest"] as const;

function PlayersPage() {
  const [filter, setFilter] = useState<(typeof filters)[number]>("All levels");
  const [connected, setConnected] = useState<string[]>([]);

  const list = [...players]
    .filter((p) => (filter === "My level" ? Math.abs(p.level - profile.level) <= 0.2 : true))
    .sort((a, b) =>
      filter === "Closest" ? parseFloat(a.distance) - parseFloat(b.distance) : 0,
    );

  return (
    <div className="min-h-screen w-full bg-sand text-ink flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="bg-ink text-sand border-b-4 border-court">
          <div className="max-w-6xl mx-auto px-6 py-12">
            <div className="font-mono text-xs uppercase tracking-[0.25em] text-court mb-4">
              /// Nearby · Level {profile.level}
            </div>
            <h1 className="font-display font-black uppercase tracking-tighter text-5xl md:text-7xl leading-[0.85]">
              Find
              <br />
              <span className="bg-court text-ink px-2 inline-block">Players.</span>
            </h1>
            <div className="mt-8 flex flex-wrap gap-2 font-mono text-xs uppercase tracking-widest">
              {filters.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`border-2 px-3 py-1.5 ${
                    filter === f ? "bg-court text-ink border-court font-bold" : "border-sand/40 text-sand"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-6 py-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((p) => {
            const isConnected = connected.includes(p.id);
            return (
              <div key={p.id} className="slab bg-sand">
                <img
                  src={p.photo}
                  alt={p.name}
                  loading="lazy"
                  width={512}
                  height={512}
                  className="w-full aspect-square object-cover border-b-2 border-ink"
                />
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-display font-black text-xl leading-none">{p.name}</div>
                    <span className="font-mono text-xs bg-ink text-court px-2 py-0.5">
                      LVL {p.level}
                    </span>
                  </div>
                  <div className="font-mono text-xs text-ink/60 mt-2">
                    {p.style} · {p.distance} · {p.rating} rating
                  </div>
                  <button
                    onClick={() => setConnected((c) => (isConnected ? c.filter((id) => id !== p.id) : [...c, p.id]))}
                    className={`mt-4 w-full font-mono text-xs font-bold uppercase px-3 py-2 ${
                      isConnected ? "bg-court text-ink" : "btn-ink"
                    }`}
                  >
                    {isConnected ? "Request sent" : "Connect"}
                  </button>
                </div>
              </div>
            );
          })}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
