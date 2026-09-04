export const LEVEL_TIERS = [
  "beginner",
  "improver",
  "intermediate",
  "advanced",
  "competitor",
  "elite",
  "expert",
] as const;

export type LevelTier = (typeof LEVEL_TIERS)[number];

export const TIER_LABEL: Record<LevelTier, string> = {
  beginner: "Beginner",
  improver: "Improver",
  intermediate: "Intermediate",
  advanced: "Advanced",
  competitor: "Competitor",
  elite: "Elite",
  expert: "Expert",
};

export function tierIndex(tier: LevelTier) {
  return LEVEL_TIERS.indexOf(tier);
}

export function tierLabel(tier: LevelTier) {
  return TIER_LABEL[tier] ?? "Intermediate";
}

export const WIN_POINTS = 25;
export const LOSS_POINTS = -12;
export const TIER_POINTS = 100;

/** Simple, non-Elo level movement: points accumulate, 100 promotes, below 0 demotes. */
export function applyResult(
  tier: LevelTier,
  points: number,
  won: boolean,
): { tier: LevelTier; points: number; delta: number; moved: "up" | "down" | null } {
  const delta = won ? WIN_POINTS : LOSS_POINTS;
  let index = tierIndex(tier);
  let next = points + delta;
  let moved: "up" | "down" | null = null;

  if (next >= TIER_POINTS) {
    if (index < LEVEL_TIERS.length - 1) {
      index += 1;
      next -= TIER_POINTS;
      moved = "up";
    } else {
      next = TIER_POINTS;
    }
  } else if (next < 0) {
    if (index > 0) {
      index -= 1;
      next = TIER_POINTS + next;
      moved = "down";
    } else {
      next = 0;
    }
  }

  return { tier: LEVEL_TIERS[index]!, points: next, delta, moved };
}
