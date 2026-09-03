import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { upsertCourtReview } from "@/lib/social.functions";
import type { CourtReview } from "@/lib/padel";

export function average(reviews: CourtReview[], key: "surface_rating" | "lighting_rating" | "crowd_rating") {
  if (reviews.length === 0) return 0;
  return reviews.reduce((sum, r) => sum + r[key], 0) / reviews.length;
}

export function RatingBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between font-mono text-[10px] uppercase tracking-widest">
        <span>{label}</span>
        <span>{value ? value.toFixed(1) : "—"}/5</span>
      </div>
      <div className="h-3 border-2 border-ink mt-1">
        <div className="h-full bg-court" style={{ width: `${(value / 5) * 100}%` }} />
      </div>
    </div>
  );
}

function Stars({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="font-mono text-[10px] uppercase tracking-widest">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`${label} ${n} of 5`}
            onClick={() => onChange(n)}
            className={`size-7 border-2 border-ink font-mono text-[10px] ${n <= value ? "bg-court" : "bg-sand"}`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Player-facing review block for a single court. */
export function CourtReviewPanel({
  courtId,
  reviews,
  mine,
}: {
  courtId: string;
  reviews: CourtReview[];
  mine: CourtReview | undefined;
}) {
  const [open, setOpen] = useState(false);
  const [surface, setSurface] = useState(mine?.surface_rating ?? 4);
  const [lighting, setLighting] = useState(mine?.lighting_rating ?? 4);
  const [crowd, setCrowd] = useState(mine?.crowd_rating ?? 4);
  const [comment, setComment] = useState(mine?.comment ?? "");
  const queryClient = useQueryClient();
  const submit = useServerFn(upsertCourtReview);

  const mutation = useMutation({
    mutationFn: () => submit({ data: { courtId, surface, lighting, crowd, comment: comment.trim() } }),
    onSuccess: () => {
      toast.success("Review saved");
      queryClient.invalidateQueries({ queryKey: ["court-reviews"] });
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mt-3 border-t-2 border-ink pt-3">
      <div className="grid sm:grid-cols-3 gap-3">
        <RatingBar label="Surface" value={average(reviews, "surface_rating")} />
        <RatingBar label="Lighting" value={average(reviews, "lighting_rating")} />
        <RatingBar label="Crowd" value={average(reviews, "crowd_rating")} />
      </div>
      <div className="mt-2 font-mono text-[10px] uppercase tracking-widest text-ink/50">
        {reviews.length} review{reviews.length === 1 ? "" : "s"}
      </div>

      {reviews.slice(0, 3).map((r) => (
        <div key={r.id} className="mt-2 font-mono text-xs text-ink/70">
          <span className="font-bold">{r.profiles?.display_name ?? "Player"}</span> · S{r.surface_rating} L
          {r.lighting_rating} C{r.crowd_rating}
          {r.comment ? ` — ${r.comment}` : ""}
        </div>
      ))}

      {open ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          className="mt-3 space-y-2"
        >
          <Stars label="Surface" value={surface} onChange={setSurface} />
          <Stars label="Lighting" value={lighting} onChange={setLighting} />
          <Stars label="Crowd" value={crowd} onChange={setCrowd} />
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={400}
            placeholder="How did the court play?"
            className="w-full border-2 border-ink bg-sand px-2 py-1.5 font-mono text-xs"
          />
          <button
            type="submit"
            disabled={mutation.isPending}
            className="btn-court font-display w-full py-2 text-xs disabled:opacity-50"
          >
            {mutation.isPending ? "Saving…" : mine ? "Update review" : "Post review"}
          </button>
        </form>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="mt-3 font-mono text-[10px] uppercase tracking-widest border-2 border-ink px-3 py-2 hover:bg-court"
        >
          {mine ? "Edit your review" : "Rate this court"}
        </button>
      )}
    </div>
  );
}
