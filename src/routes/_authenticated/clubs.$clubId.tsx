import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useClub } from "@/lib/padel";
import { euros } from "@/lib/slots";

export const Route = createFileRoute("/_authenticated/clubs/$clubId")({
  head: () => ({
    meta: [
      { title: "Padel Club Profile — PADEL360" },
      {
        name: "description",
        content: "Club details, courts, surfaces and hourly pricing for this padel club, plus a direct link to book a slot.",
      },
      { property: "og:title", content: "Padel Club Profile — PADEL360" },
      { property: "og:description", content: "Courts, surfaces and pricing for this padel club." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ClubDetailPage,
});

function ClubDetailPage() {
  const { clubId } = useParams({ from: "/_authenticated/clubs/$clubId" });
  const { data: club, isLoading } = useClub(clubId);

  return (
    <div className="min-h-screen w-full bg-sand text-ink flex flex-col">
      <SiteHeader />

      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-10">
        {isLoading ? (
          <div className="slab p-6 font-mono text-sm text-ink/60">Loading club…</div>
        ) : !club ? (
          <div className="slab p-6 font-mono text-sm text-ink/60">This club could not be found.</div>
        ) : (
          <>
            <h1 className="font-display font-black uppercase tracking-tighter text-5xl md:text-6xl leading-none">
              {club.name}
            </h1>
            <p className="font-mono text-xs text-ink/60 mt-3">
              {club.location_label} · {euros(club.price_cents)} / hour
            </p>

            {club.photo_url && (
              <img
                src={club.photo_url}
                alt={`${club.name} padel club courts`}
                loading="lazy"
                className="mt-6 w-full max-h-80 object-cover border-2 border-ink"
              />
            )}

            {club.description && (
              <p className="mt-6 font-mono text-sm text-ink/70 leading-relaxed max-w-2xl">{club.description}</p>
            )}
            {club.address && <p className="mt-3 font-mono text-xs text-ink/60">{club.address}</p>}

            <div className="mt-8 slab-thick bg-sand">
              <div className="bg-ink text-sand px-5 py-3 font-mono text-xs uppercase tracking-widest">Courts</div>
              <ul>
                {club.courts.map((court) => (
                  <li key={court.id} className="border-t-2 border-ink px-5 py-4">
                    <div className="font-display font-black text-xl leading-none">{court.name}</div>
                    <div className="font-mono text-xs text-ink/60 mt-1">
                      {[court.surface, court.description].filter(Boolean).join(" · ") || "Padel court"}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <Link to="/courts" className="mt-8 inline-block btn-court font-display px-6 py-3 text-sm">
              Book a slot here
            </Link>
          </>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
