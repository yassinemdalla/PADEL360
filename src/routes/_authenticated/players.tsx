import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useSession } from "@/lib/auth";
import { usePlayers } from "@/lib/padel";

export const Route = createFileRoute("/_authenticated/players")({
  head: () => ({
    meta: [
      { title: "Find Padel Players At Your Level — PADEL360" },
      {
        name: "description",
        content: "Browse padel players by level and playing style, then connect with the ones who match your game.",
      },
      { property: "og:title", content: "Find Padel Players At Your Level — PADEL360" },
      { property: "og:description", content: "Discover and connect with players who match your padel level." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PlayersPage,
});

const bands = [
  { id: "all", label: "All levels" },
  { id: "near", label: "Near my level" },
  { id: "higher", label: "Above me" },
] as const;

function PlayersPage() {
  const { data: session } = useSession();
  const { data: players = [], isLoading } = usePlayers(session?.userId);
  const [band, setBand] = useState<(typeof bands)[number]["id"]>("all");

  const myLevel = session?.level ?? 3;
  const filtered = players.filter((p) => {
    if (band === "near") return Math.abs(p.level - myLevel) <= 0.5;
    if (band === "higher") return p.level > myLevel;
    return true;
  });

  return (
    <div className="min-h-screen w-full bg-sand text-ink flex flex-col">
      <SiteHeader />

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10">
        <h1 className="font-display font-black uppercase tracking-tighter text-5xl md:text-6xl leading-none">
          Find Players
        </h1>
        <p className="font-mono text-xs text-ink/60 mt-3">
          Your level: {myLevel.toFixed(1)} · {filtered.length} players listed
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {bands.map((b) => (
            <button
              key={b.id}
              onClick={() => setBand(b.id)}
              className={`font-mono text-xs uppercase tracking-widest border-2 border-ink px-3 py-2 ${
                band === b.id ? "bg-ink text-sand" : "hover:bg-court"
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="mt-8 slab p-6 font-mono text-sm text-ink/60">Loading players…</div>
        ) : filtered.length === 0 ? (
          <div className="mt-8 slab p-6 font-mono text-sm text-ink/60">No players match this filter yet.</div>
        ) : (
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((p) => (
              <div key={p.id} className="slab p-4 bg-sand flex items-center gap-4">
                {p.avatar_url ? (
                  <img
                    src={p.avatar_url}
                    alt={`${p.display_name}, padel player`}
                    loading="lazy"
                    className="size-14 object-cover shrink-0"
                  />
                ) : (
                  <div className="size-14 shrink-0 bg-ink text-court grid place-items-center font-mono text-sm font-bold">
                    {p.initials}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-display font-bold leading-none truncate">{p.display_name}</div>
                  <div className="font-mono text-xs text-ink/60 mt-1">
                    Lvl {p.level.toFixed(1)} · {p.style}
                  </div>
                </div>
                <button
                  onClick={() => toast.success(`Connection request sent to ${p.display_name}`)}
                  className="btn-ink font-mono text-xs px-3 py-2"
                >
                  Connect
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
