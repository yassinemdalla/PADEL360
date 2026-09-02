import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PADEL360 — Find the game, track the growth" },
      {
        name: "description",
        content:
          "Track padel matches, watch your level climb, meet players at your skill level and book courts at nearby clubs.",
      },
      { property: "og:title", content: "PADEL360 — Find the game, track the growth" },
      {
        property: "og:description",
        content: "The full padel ecosystem: match history, level progression, player discovery and court booking.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const features = [
  {
    title: "Match History",
    body: "Log every match, score and opponent. Your level moves with each result.",
  },
  {
    title: "Find Players",
    body: "Discover players near your level and connect before the next session.",
  },
  {
    title: "Book Courts",
    body: "Live availability on the map at nearby clubs — reserve in two taps.",
  },
  {
    title: "Club Manager",
    body: "Run your courts: schedules, bookings, holds and club profile.",
  },
];

function Index() {
  return (
    <div className="min-h-screen w-full bg-sand text-ink">
      <SiteHeader />

      <section className="bg-ink text-sand">
        <div className="max-w-6xl mx-auto px-6 py-16 md:py-24">
          <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.25em] text-court mb-5">
            <span className="hidden sm:inline">///</span> Season 2026
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
            PADEL360 is the full court ecosystem — discover players at your level, book nearby
            courts, and watch your padel level climb, match by match.
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

      <section className="border-b-4 border-ink">
        <div className="max-w-6xl mx-auto px-6 py-14">
          <h2 className="font-display font-black uppercase tracking-tighter text-4xl md:text-5xl leading-none mb-8">
            One app, both sides of the net
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f) => (
              <div key={f.title} className="slab p-5 bg-sand">
                <div className="font-display font-black uppercase text-xl leading-none">{f.title}</div>
                <p className="font-mono text-xs text-ink/70 mt-3 leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
