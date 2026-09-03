import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { useMyClub, useCourtReviews } from "@/lib/padel";
import { RatingBar, average } from "@/components/CourtReviews";

export const Route = createFileRoute("/_authenticated/club")({
  head: () => ({
    meta: [
      { title: "Edit Your Club Profile — PADEL360 Manager" },
      {
        name: "description",
        content: "Update your padel club details, photo, address and court descriptions so players see the right info when booking.",
      },
      { property: "og:title", content: "Edit Your Club Profile — PADEL360 Manager" },
      { property: "og:description", content: "Club details, photos and court descriptions for your padel club." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ClubProfilePage,
});

type ClubForm = {
  name: string;
  location_label: string;
  address: string;
  description: string;
  photo_url: string;
  price_cents: number;
};

function ClubProfilePage() {
  const { data: session } = useSession();
  const { data: club, isLoading } = useMyClub(session?.userId);
  const queryClient = useQueryClient();

  const [form, setForm] = useState<ClubForm | null>(null);
  const [courtFields, setCourtFields] = useState<Record<string, { description: string; surface: string }>>({});

  useEffect(() => {
    if (!club) return;
    setForm({
      name: club.name,
      location_label: club.location_label ?? "",
      address: club.address ?? "",
      description: club.description ?? "",
      photo_url: club.photo_url ?? "",
      price_cents: club.price_cents,
    });
    setCourtFields(
      Object.fromEntries(
        club.courts.map((c) => [c.id, { description: c.description ?? "", surface: c.surface ?? "" }]),
      ),
    );
  }, [club]);

  const save = useMutation({
    mutationFn: async () => {
      if (!club || !form) throw new Error("Nothing to save");
      const { error } = await supabase
        .from("clubs")
        .update({
          name: form.name,
          location_label: form.location_label,
          address: form.address,
          description: form.description,
          photo_url: form.photo_url,
          price_cents: form.price_cents,
        })
        .eq("id", club.id);
      if (error) throw new Error(error.message);

      for (const court of club.courts) {
        const fields = courtFields[court.id];
        if (!fields) continue;
        const { error: courtError } = await supabase
          .from("courts")
          .update({ description: fields.description, surface: fields.surface })
          .eq("id", court.id);
        if (courtError) throw new Error(courtError.message);
      }
    },
    onSuccess: () => {
      toast.success("Club profile updated");
      queryClient.invalidateQueries({ queryKey: ["my-club"] });
      queryClient.invalidateQueries({ queryKey: ["clubs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const inputClass =
    "w-full border-2 border-ink bg-sand px-3 py-2 font-mono text-sm focus:outline-none focus:bg-court/20";
  const labelClass = "font-mono text-[10px] uppercase tracking-widest text-ink/60";

  return (
    <div className="min-h-screen w-full bg-sand text-ink flex flex-col">
      <SiteHeader />

      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-10">
        <h1 className="font-display font-black uppercase tracking-tighter text-5xl md:text-6xl leading-none">
          Club Profile
        </h1>

        {isLoading ? (
          <div className="mt-8 slab p-6 font-mono text-sm text-ink/60">Loading your club…</div>
        ) : !club || !form ? (
          <div className="mt-8 slab p-6 font-mono text-sm text-ink/60">
            No club is linked to your account yet.
          </div>
        ) : (
          <form
            className="mt-8 space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate();
            }}
          >
            <div className="slab-thick bg-sand">
              <div className="bg-ink text-sand px-5 py-3 font-mono text-xs uppercase tracking-widest">Details</div>
              <div className="p-5 grid sm:grid-cols-2 gap-4">
                <label className="space-y-1">
                  <span className={labelClass}>Club name</span>
                  <input
                    className={inputClass}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </label>
                <label className="space-y-1">
                  <span className={labelClass}>Location label</span>
                  <input
                    className={inputClass}
                    value={form.location_label}
                    onChange={(e) => setForm({ ...form, location_label: e.target.value })}
                  />
                </label>
                <label className="space-y-1 sm:col-span-2">
                  <span className={labelClass}>Address</span>
                  <input
                    className={inputClass}
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                  />
                </label>
                <label className="space-y-1 sm:col-span-2">
                  <span className={labelClass}>Description</span>
                  <textarea
                    rows={4}
                    className={inputClass}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </label>
                <label className="space-y-1">
                  <span className={labelClass}>Photo URL</span>
                  <input
                    className={inputClass}
                    value={form.photo_url}
                    onChange={(e) => setForm({ ...form, photo_url: e.target.value })}
                  />
                </label>
                <label className="space-y-1">
                  <span className={labelClass}>Price per hour (cents)</span>
                  <input
                    type="number"
                    min={0}
                    className={inputClass}
                    value={form.price_cents}
                    onChange={(e) => setForm({ ...form, price_cents: Number(e.target.value) })}
                  />
                </label>
              </div>
              {form.photo_url && (
                <div className="px-5 pb-5">
                  <img
                    src={form.photo_url}
                    alt={`${form.name} padel club`}
                    loading="lazy"
                    className="w-full max-h-64 object-cover border-2 border-ink"
                  />
                </div>
              )}
            </div>

            <div className="slab-thick bg-sand">
              <div className="bg-court text-ink px-5 py-3 font-mono text-xs uppercase tracking-widest">Courts</div>
              <div className="p-5 space-y-4">
                {club.courts.map((court) => (
                  <div key={court.id} className="slab p-4 grid sm:grid-cols-3 gap-3">
                    <div className="font-display font-black text-xl leading-none self-center">{court.name}</div>
                    <label className="space-y-1">
                      <span className={labelClass}>Surface</span>
                      <input
                        className={inputClass}
                        value={courtFields[court.id]?.surface ?? ""}
                        onChange={(e) =>
                          setCourtFields({
                            ...courtFields,
                            [court.id]: { ...courtFields[court.id]!, surface: e.target.value },
                          })
                        }
                      />
                    </label>
                    <label className="space-y-1">
                      <span className={labelClass}>Description</span>
                      <input
                        className={inputClass}
                        value={courtFields[court.id]?.description ?? ""}
                        onChange={(e) =>
                          setCourtFields({
                            ...courtFields,
                            [court.id]: { ...courtFields[court.id]!, description: e.target.value },
                          })
                        }
                      />
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" disabled={save.isPending} className="btn-court font-display px-6 py-3 text-sm">
              {save.isPending ? "Saving…" : "Save club profile"}
            </button>
          </form>
        )}

        {club && <ManagerReviews courts={club.courts} />}

      </main>

      <SiteFooter />
    </div>
  );
}

/** Read-only view of what players said about each court. */
function ManagerReviews({ courts }: { courts: { id: string; name: string }[] }) {
  const { data: reviews = [] } = useCourtReviews(courts.map((c) => c.id));

  return (
    <section className="mt-10">
      <h2 className="font-display font-black uppercase tracking-tighter text-3xl leading-none mb-4">
        Player reviews
      </h2>
      <div className="space-y-4">
        {courts.map((court) => {
          const list = reviews.filter((r) => r.court_id === court.id);
          return (
            <div key={court.id} className="slab p-4 bg-sand">
              <div className="font-display font-black text-xl leading-none">{court.name}</div>
              <div className="grid sm:grid-cols-3 gap-3 mt-3">
                <RatingBar label="Surface" value={average(list, "surface_rating")} />
                <RatingBar label="Lighting" value={average(list, "lighting_rating")} />
                <RatingBar label="Crowd" value={average(list, "crowd_rating")} />
              </div>
              {list.length === 0 ? (
                <div className="mt-3 font-mono text-xs text-ink/50">No reviews yet.</div>
              ) : (
                list.map((r) => (
                  <div key={r.id} className="mt-2 font-mono text-xs text-ink/70">
                    <span className="font-bold">{r.profiles?.display_name ?? "Player"}</span> · S{r.surface_rating} L
                    {r.lighting_rating} C{r.crowd_rating}
                    {r.comment ? ` — ${r.comment}` : ""}
                  </div>
                ))
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
