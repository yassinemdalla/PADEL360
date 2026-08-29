import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { profile, matches, players, managerSchedule } from "@/lib/padel-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PadelBase — Find the game, track the growth" },
      {
        name: "description",
        content:
          "Track padel matches, watch your level climb, meet players at your skill level and book courts at nearby clubs.",
      },
      { property: "og:title", content: "PadelBase — Find the game, track the growth" },
      {
        property: "og:description",
        content: "The full padel ecosystem: match history, level progression, player discovery and court booking.",
      },
    ],
  }),
  component: Index,
});

const resultStyles: Record<string, string> = {
  WIN: "bg-court text-ink",
  LOSS: "bg-clay text-sand",
  DRAW: "bg-ink text-sand",
};

function Index() {
  return (
    <div className="min-h-screen w-full bg-sand text-ink">
      <SiteHeader />

      <section className="bg-ink text-sand">
        <div className="max-w-6xl mx-auto px-6 py-14 md:py-20 grid md:grid-cols-12 gap-8 md:gap-10">
          <div className="md:col-span-8">
            <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.25em] text-court mb-5">
              <span className="hidden sm:inline">///</span> Season 2026 · Level {profile.level}
            </div>
            <h1 className="font-display font-black uppercase leading-[0.82] tracking-tighter text-[3.5rem] sm:text-7xl md:text-8xl">
              Find the
              <br />
              <span className="bg-court text-ink px-2 inline-block">Game.</span>
              <br />
              Track the
              <br />
              <span className="text-clay">Growth.</span>
            </h1>
            <p className="mt-6 max-w-md font-mono text-sm text-sand/70 leading-relaxed">
              PadelBase is the full court ecosystem — discover players at your level, book nearby
              courts, and watch your padel level climb, match by match.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/players"
                className="btn-court font-display px-6 py-3 text-sm"
              >
                Find a match
              </Link>
              <Link
                to="/manager"
                className="border-2 border-sand font-display font-bold uppercase tracking-wide px-6 py-3 text-sm hover:bg-sand hover:text-ink"
              >
                Manage a club
              </Link>
            </div>
          </div>

          <div className="md:col-span-4">
            <div className="bg-sand text-ink p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-xs uppercase tracking-widest">Player Profile</span>
                <span className="font-mono text-xs bg-ink text-court px-2 py-0.5">
                  LVL {profile.level}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <img
                  src={profile.photo}
                  alt={`${profile.name}, padel player`}
                  width={512}
                  height={512}
                  className="size-20 object-cover shrink-0"
                />
                <div>
                  <div className="font-display font-black text-xl leading-none">{profile.name}</div>
                  <div className="font-mono text-xs text-ink/60 mt-1">
                    {profile.points} pts · {profile.matches} matches
                  </div>
                </div>
              </div>
              <div className="mt-5">
                <div className="flex justify-between font-mono text-xs mb-1">
                  <span>Level progress</span>
                  <span>
                    {profile.level} / {profile.nextLevel}
                  </span>
                </div>
                <div className="h-4 bg-ink/10">
                  <div
                    className="h-full bg-court transition-[width] duration-700"
                    style={{ width: `${profile.progress}%` }}
                  />
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {[
                  { v: profile.wins, l: "Wins" },
                  { v: profile.serveRatio, l: "Serves" },
                  { v: profile.streak, l: "Streak" },
                ].map((s) => (
                  <div key={s.l} className="slab p-2">
                    <div className="font-display font-black text-2xl leading-none">{s.v}</div>
                    <div className="font-mono text-[10px] uppercase tracking-wide text-ink/60 mt-1">
                      {s.l}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b-4 border-ink">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex items-end justify-between mb-8">
            <h2 className="font-display font-black uppercase tracking-tighter text-4xl md:text-5xl leading-none">
              Match History
            </h2>
            <Link to="/matches" className="font-mono text-xs uppercase tracking-widest text-ink/50 hover:text-ink">
              Last 5 · All
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {matches.slice(0, 5).map((m) => (
              <div key={m.id} className="slab p-4 bg-sand">
                <div className="font-mono text-xs text-ink/60">{m.date}</div>
                <div className="font-display font-black text-lg mt-1">{m.opponent}</div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="font-display font-black text-2xl">{m.score}</span>
                  <span className={`${resultStyles[m.result]} font-mono text-xs font-bold px-2 py-0.5`}>
                    {m.result}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-sand">
        <div className="max-w-6xl mx-auto px-6 py-12 grid lg:grid-cols-2 gap-6">
          <div className="slab-thick bg-sand">
            <div className="bg-court text-ink px-5 py-3 flex items-center justify-between">
              <h3 className="font-display font-black uppercase tracking-tight text-xl">Find Players</h3>
              <span className="font-mono text-xs font-bold">Nearby · Level match</span>
            </div>
            <div className="p-5 space-y-3">
              {players.slice(0, 3).map((p) => (
                <div key={p.id} className="flex items-center gap-4 slab p-3">
                  <img
                    src={p.photo}
                    alt={p.name}
                    loading="lazy"
                    width={512}
                    height={512}
                    className="size-14 object-cover shrink-0"
                  />
                  <div className="flex-1">
                    <div className="font-display font-bold leading-none">{p.name}</div>
                    <div className="font-mono text-xs text-ink/60 mt-1">
                      Lvl {p.level} · {p.distance} · {p.rating}
                    </div>
                  </div>
                  <button className="btn-ink font-mono text-xs px-3 py-2">Connect</button>
                </div>
              ))}
            </div>
          </div>

          <div className="slab-thick bg-ink text-sand">
            <div className="bg-clay text-sand px-5 py-3 flex items-center justify-between">
              <h3 className="font-display font-black uppercase tracking-tight text-xl">Club Manager</h3>
              <span className="font-mono text-xs font-bold">Court 2 · Live</span>
            </div>
            <div className="p-5">
              <div className="font-mono text-xs uppercase tracking-widest text-sand/60 mb-2">
                Today's schedule
              </div>
              <div className="space-y-2 font-mono text-sm">
                {managerSchedule.slice(0, 4).map((row, i) => {
                  const slot = row.courts[0]!;
                  const label =
                    slot.state === "booked"
                      ? `Booked · ${slot.label}`
                      : slot.state === "hold"
                        ? `Hold · ${slot.label}`
                        : "Available";
                  const dot =
                    slot.state === "booked" ? "bg-court" : slot.state === "hold" ? "bg-clay" : "bg-sand";
                  return (
                    <div
                      key={row.time}
                      className={`flex items-center justify-between border-2 px-3 py-2 ${
                        i === 1 ? "border-court bg-court/10" : "border-sand/20"
                      }`}
                    >
                      <span>{row.time}</span>
                      <span className="flex items-center gap-2">
                        <span className={`size-2 inline-block ${dot}`} />
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="border-2 border-sand/30 p-3">
                  <div className="font-display font-black text-3xl leading-none">24</div>
                  <div className="font-mono text-[10px] uppercase tracking-wide text-sand/60 mt-1">
                    Bookings today
                  </div>
                </div>
                <div className="border-2 border-sand/30 p-3">
                  <div className="font-display font-black text-3xl leading-none">86%</div>
                  <div className="font-mono text-[10px] uppercase tracking-wide text-sand/60 mt-1">
                    Court occupancy
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
