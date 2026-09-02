import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useSession } from "@/lib/auth";
import { useMyMatches } from "@/lib/padel";

export const Route = createFileRoute("/_authenticated/matches")({
  head: () => ({
    meta: [
      { title: "Match History & Level Progression — PadelBase" },
      {
        name: "description",
        content: "Every padel match you have played, with scores, opponents, clubs and the level change each result earned.",
      },
      { property: "og:title", content: "Match History & Level Progression — PadelBase" },
      { property: "og:description", content: "Scores, opponents and level deltas for every match you play." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MatchesPage,
});

function MatchesPage() {
  const { data: session } = useSession();
  const { data: matches = [], isLoading } = useMyMatches(session?.userId);

  const wins = matches.filter((m) => m.result === "WIN").length;
  const delta = matches.reduce((sum, m) => sum + m.level_delta, 0);
  const winRate = matches.length ? Math.round((wins / matches.length) * 100) : 0;

  return (
    <div className="min-h-screen w-full bg-sand text-ink flex flex-col">
      <SiteHeader />

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10">
        <h1 className="font-display font-black uppercase tracking-tighter text-5xl md:text-6xl leading-none">
          Match History
        </h1>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
          {[
            { v: matches.length, l: "Matches" },
            { v: wins, l: "Wins" },
            { v: `${winRate}%`, l: "Win rate" },
            { v: `${delta >= 0 ? "+" : ""}${delta.toFixed(2)}`, l: "Level change" },
          ].map((s) => (
            <div key={s.l} className="slab p-4 bg-sand">
              <div className="font-display font-black text-3xl leading-none">{s.v}</div>
              <div className="font-mono text-[10px] uppercase tracking-wide text-ink/60 mt-1">{s.l}</div>
            </div>
          ))}
        </div>

        <div className="mt-8 slab-thick bg-sand">
          <div className="bg-ink text-sand px-5 py-3 font-mono text-xs uppercase tracking-widest">
            All results
          </div>
          {isLoading ? (
            <div className="p-6 font-mono text-sm text-ink/60">Loading matches…</div>
          ) : matches.length === 0 ? (
            <div className="p-6 font-mono text-sm text-ink/60">No matches recorded yet.</div>
          ) : (
            <ul>
              {matches.map((m) => (
                <li
                  key={m.id}
                  className="flex flex-wrap items-center gap-3 justify-between border-t-2 border-ink px-5 py-4"
                >
                  <div>
                    <div className="font-display font-black text-xl leading-none">{m.opponent}</div>
                    <div className="font-mono text-xs text-ink/60 mt-1">
                      {new Date(m.played_on).toLocaleDateString(undefined, {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}{" "}
                      · {m.club_label}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-display font-black text-2xl">{m.score}</span>
                    <span className="font-mono text-xs text-ink/60 w-14 text-right">
                      {m.level_delta >= 0 ? "+" : ""}
                      {m.level_delta.toFixed(2)}
                    </span>
                    <span
                      className={`font-mono text-xs font-bold px-2 py-0.5 ${
                        m.result === "WIN" ? "bg-court text-ink" : "bg-clay text-sand"
                      }`}
                    >
                      {m.result}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
