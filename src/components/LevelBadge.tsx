import { tierLabel, TIER_POINTS, type LevelTier } from "@/lib/levels";

export function LevelBadge({ tier, points }: { tier: LevelTier; points?: number }) {
  return (
    <span className="chip bg-accent text-accent-foreground">
      <span className="size-1.5 rounded-full bg-primary" />
      {tierLabel(tier)}
      {typeof points === "number" && <span className="opacity-70">{points}/{TIER_POINTS}</span>}
    </span>
  );
}

export function LevelProgress({ tier, points }: { tier: LevelTier; points: number }) {
  const pct = Math.max(0, Math.min(100, (points / TIER_POINTS) * 100));
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">{tierLabel(tier)}</span>
        <span>
          {points} / {TIER_POINTS} pts
        </span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
