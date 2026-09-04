import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { LevelTier } from "./levels";

export type SessionInfo = {
  userId: string;
  email: string;
  displayName: string;
  initials: string;
  city: string;
  tier: LevelTier;
  points: number;
  avatarUrl: string | null;
};

export const sessionQueryKey = ["session"] as const;

export async function fetchSession(): Promise<SessionInfo | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  const user = data.user;
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, initials, city, level_tier, level_points, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const fallbackName = user.email?.split("@")[0] ?? "Player";

  return {
    userId: user.id,
    email: user.email ?? "",
    displayName: profile?.display_name ?? fallbackName,
    initials: (profile?.initials ?? fallbackName.slice(0, 2)).toUpperCase(),
    city: profile?.city ?? "Sousse",
    tier: (profile?.level_tier ?? "intermediate") as LevelTier,
    points: Number(profile?.level_points ?? 0),
    avatarUrl: profile?.avatar_url ?? null,
  };
}

export function useSession() {
  return useQuery({
    queryKey: sessionQueryKey,
    queryFn: fetchSession,
    staleTime: 30_000,
  });
}
