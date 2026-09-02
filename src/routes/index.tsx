import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PADEL360 — Book padel courts in Sousse, track your level" },
      {
        name: "description",
        content:
          "PADEL360 connects padel players and clubs in Sousse: live court availability, match history, level progression and player discovery.",
      },
      { property: "og:title", content: "PADEL360 — Book padel courts in Sousse, track your level" },
      {
        property: "og:description",
        content: "Live court availability across Sousse clubs, match history, level progression and player discovery.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const pillars = [
  {
    to: "/courts",
    kicker: "01",
    title: "Book Courts",
    body: "Live availability on the map across Sahloul, Port El Kantaoui, Khezama, Hammam Sousse and the Medina. Reserve in two taps.",
    cta: "Open the court map",
  },
  {
    to: "/matches",
    kicker: "02",
    title: "Match History",
    body: "Log every match straight from a finished booking — opponent, score, result — and watch your level move with each one.",
    cta: "See match history",
  },
  {
    to: "/players",
    kicker: "03",
    title: "Find Players",
    body: "Discover padel players at your level nearby and line up the next session before the court goes cold.",
    cta: "Browse players",
  },
] as const;

const stats = [
  { v: "5", l: "Sousse clubs" },
  { v: "14", l: "Courts on the map" },
  { v: "08–22", l: "Daily slots" },
  { v: "2", l: "Taps to book" },
];

function Index() {
  return (
    <div className="min-h-screen w-full bg-sand text-ink">
      <SiteHeader />

      <section className="bg-ink text-sand">
        <div className="max-w-6xl mx-auto px-6 py-16 md:py-24">
          <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.25em] text-court mb-5">
            <span className="hidden sm:inline">///</span> Sousse · Season 2026
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
            PADEL360 is the full court ecosystem for Sousse — discover players at your level, book
            nearby courts, and watch your padel level climb, match by match.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/auth" className="btn-court font-display px-6 py-3 text-sm">
              Get started
            </Link>
            <Link
              to="/courts"
              className="border-2 border-sand font-display font-bold uppercase tracking-wide px-6 py-3 text-sm hover:bg-sand hover:text-ink"
            >
              Browse courts
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b-4 border-ink bg-court text-ink">
        <div className="max-w-6xl mx-auto px-6 py-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.l}>
              <div className="font-display font-black text-4xl leading-none">{s.v}</div>
              <div className="font-mono text-[10px] uppercase tracking-widest mt-1">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-b-4 border-ink">
        <div className="max-w-6xl mx-auto px-6 py-14">
          <h2 className="font-display font-black uppercase tracking-tighter text-4xl md:text-5xl leading-none mb-8">
            One app, both sides of the net
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {pillars.map((p) => (
              <Link key={p.title} to={p.to} className="slab p-6 bg-sand hover:bg-court transition-colors block">
                <div className="font-mono text-xs text-ink/50">{p.kicker}</div>
                <div className="font-display font-black uppercase text-2xl leading-none mt-2">{p.title}</div>
                <p className="font-mono text-xs text-ink/70 mt-3 leading-relaxed">{p.body}</p>
                <div className="font-mono text-[10px] uppercase tracking-widest mt-5 underline">{p.cta} →</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-ink text-sand">
        <div className="max-w-6xl mx-auto px-6 py-14 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="font-display font-black uppercase tracking-tighter text-4xl md:text-5xl leading-none">
              Run a club?
            </h2>
            <p className="font-mono text-sm text-sand/70 mt-4 max-w-md leading-relaxed">
              Manage court schedules, block maintenance slots, edit your club profile and photos, and
              see every incoming booking as it lands.
            </p>
          </div>
          <Link to="/auth" className="btn-court font-display px-6 py-3 text-sm self-start">
            Open the club side
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
