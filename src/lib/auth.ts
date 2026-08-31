import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "player" | "club_manager";

export type SessionInfo = {
  userId: string;
  email: string;
  displayName: string;
  initials: string;
  level: number;
  style: string;
  role: AppRole;
};

export const sessionQueryKey = ["session"] as const;

export async function fetchSession(): Promise<SessionInfo | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  const user = data.user;
  const [{ data: profile }, { data: roles }] = await Promise.all([
    supabase.from("profiles").select("display_name, initials, level, style").eq("id", user.id).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", user.id),
  ]);

  const role: AppRole = roles?.some((r) => r.role === "club_manager") ? "club_manager" : "player";

  return {
    userId: user.id,
    email: user.email ?? "",
    displayName: profile?.display_name ?? user.email?.split("@")[0] ?? "Player",
    initials: profile?.initials ?? "PB",
    level: Number(profile?.level ?? 3),
    style: profile?.style ?? "Baseline",
    role,
  };
}

export function useSession() {
  return useQuery({
    queryKey: sessionQueryKey,
    queryFn: fetchSession,
    staleTime: 30_000,
  });
}
