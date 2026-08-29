import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { matches, profile } from "@/lib/padel-data";

export const Route = createFileRoute("/matches")({
  head: () => ({
    meta: [
      { title: "Match History & Level Progression — PadelBase" },
      {
        name: "description",
        content: "Every padel match you've played, scorelines, level deltas and how your rating has moved.",
      },
      { property: "og:title", content: "Match History & Level Progression — PadelBase" },
      {
        property: "og:description",
        content: "Scorelines, results and level deltas across your padel season.",
      },
    ],
  }),
  component: MatchesPage,
});

const resultStyles: Record<string, string> = {
  WIN: "bg-court text-ink",
  LOSS: "bg-clay text-sand",
  DRAW: "bg-ink text-sand",
};

function MatchesPage() {
  const wins = matches.filter((m) => m.result === "WIN").length;
  const losses = matches.filter((m) => m.result === "LOSS").length;

  return (
    <div className="min-h-screen w-full bg-sand text-ink flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="bg-ink text-sand border-b-4 border-court">
          <div className="max-w-6xl mx-auto px-6 py-12">
            <div className="font-mono text-xs uppercase tracking-[0.25em] text-court mb-4">
              /// Progression
            </div>
            <h1 className="font-display font-black uppercase tracking-tighter text-5xl md:text-7xl leading-[0.85]">
              Match
              <br />
              History
            </h1>
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { v: matches.length, l: "Matches logged" },
                { v: wins, l: "Wins" },
                { v: losses, l: "Losses" },
                { v: profile.level, l: "Current level" },
              ].map((s) => (
                <div key={s.l} className="border-2 border-sand/30 p-3">
                  <div className="font-display font-black text-3xl leading-none">{s.v}</div>
                  <div className="font-mono text-[10px] uppercase tracking-wide text-sand/60 mt-1">
                    {s.l}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-6 py-12">
          <div className="slab-thick">
            {matches.map((m) => (
              <div
                key={m.id}
                className="flex flex-wrap items-center gap-4 border-b-2 border-ink last:border-b-0 px-4 py-4"
              >
                <div className="font-mono text-xs text-ink/60 w-16">{m.date}</div>
                <div className="flex-1 min-w-40">
                  <div className="font-display font-black text-lg leading-none">{m.opponent}</div>
                  <div className="font-mono text-xs text-ink/60 mt-1">{m.club}</div>
                </div>
                <div className="font-display font-black text-3xl tabular-nums">{m.score}</div>
                <div className="font-mono text-xs font-bold w-12 text-right">{m.delta}</div>
                <span className={`${resultStyles[m.result]} font-mono text-xs font-bold px-2 py-0.5`}>
                  {m.result}
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
