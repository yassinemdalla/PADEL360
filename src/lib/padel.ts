import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { dayBounds } from "./slots";
import type { LevelTier } from "./levels";

export type Court = {
  id: string;
  club_id: string;
  name: string;
  position: number;
  description: string;
  surface: string;
  court_type: string;
  price_per_hour_cents: number;
  open_from: number;
  open_to: number;
};

export type Club = {
  id: string;
  name: string;
  city: string;
  location_label: string;
  price_cents: number;
  description: string | null;
  photo_url: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  courts: Court[];
};

const COURT_FIELDS =
  "id, club_id, name, position, description, surface, court_type, price_per_hour_cents, open_from, open_to";

const CLUB_SELECT = `id, name, city, location_label, price_cents, description, photo_url, address, latitude, longitude, courts(${COURT_FIELDS})`;

function sortCourts(club: Club): Club {
  return { ...club, courts: [...(club.courts ?? [])].sort((a, b) => a.position - b.position) };
}

export function useClubs() {
  return useQuery({
    queryKey: ["clubs"],
    queryFn: async (): Promise<Club[]> => {
      const { data, error } = await supabase.from("clubs").select(CLUB_SELECT).order("name");
      if (error) throw new Error(error.message);
      return (data as unknown as Club[]).map(sortCourts);
    },
  });
}

export function useClub(clubId: string | undefined) {
  return useQuery({
    enabled: Boolean(clubId),
    queryKey: ["club", clubId],
    queryFn: async (): Promise<Club | null> => {
      const { data, error } = await supabase.from("clubs").select(CLUB_SELECT).eq("id", clubId!).maybeSingle();
      if (error) throw new Error(error.message);
      return data ? sortCourts(data as unknown as Club) : null;
    },
  });
}

export type DayBooking = {
  id: string;
  court_id: string;
  starts_at: string;
  ends_at: string;
  player_id: string;
  status: string;
};

/** Confirmed bookings for a set of courts on a single day. */
export function useDayBookings(courtIds: string[], day: Date) {
  const { from, to } = dayBounds(day);
  return useQuery({
    enabled: courtIds.length > 0,
    queryKey: ["day-bookings", [...courtIds].sort().join(","), from.toISOString()],
    queryFn: async (): Promise<DayBooking[]> => {
      const { data, error } = await supabase
        .from("bookings")
        .select("id, court_id, starts_at, ends_at, player_id, status")
        .in("court_id", courtIds)
        .neq("status", "cancelled")
        .gte("starts_at", from.toISOString())
        .lt("starts_at", to.toISOString());
      if (error) throw new Error(error.message);
      return (data ?? []) as DayBooking[];
    },
  });
}

export type MyBooking = {
  id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  price_cents: number;
  courts: { id: string; name: string; court_type: string; clubs: { id: string; name: string; city: string } | null } | null;
};

const BOOKING_SELECT =
  "id, starts_at, ends_at, status, price_cents, courts(id, name, court_type, clubs(id, name, city))";

export function useMyBookings(userId: string | undefined) {
  return useQuery({
    enabled: Boolean(userId),
    queryKey: ["my-bookings", userId],
    queryFn: async (): Promise<MyBooking[]> => {
      const { data, error } = await supabase
        .from("bookings")
        .select(BOOKING_SELECT)
        .eq("player_id", userId!)
        .order("starts_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as unknown as MyBooking[];
    },
  });
}

export type MatchPlayer = {
  id: string;
  match_id: string;
  player_id: string;
  status: string;
  side: number | null;
};

export type MatchResult = {
  winner_side: number;
  score_text: string;
  recorded_by: string;
  recorded_at: string;
};

export type MatchRow = {
  id: string;
  creator_id: string;
  club_id: string;
  court_id: string | null;
  booking_id: string | null;
  starts_at: string;
  ends_at: string;
  level_required: LevelTier;
  max_players: number;
  is_public: boolean;
  notes: string;
  clubs: { id: string; name: string; city: string; address: string | null } | null;
  courts: { id: string; name: string; court_type: string } | null;
  match_players: MatchPlayer[];
  match_results: MatchResult[];
};

const MATCH_SELECT =
  "id, creator_id, club_id, court_id, booking_id, starts_at, ends_at, level_required, max_players, is_public, notes, clubs(id, name, city, address), courts(id, name, court_type), match_players(id, match_id, player_id, status, side), match_results(winner_side, score_text, recorded_by, recorded_at)";

/** All matches, newest first — filtering happens in the UI. */
export function useMatches() {
  return useQuery({
    queryKey: ["matches"],
    queryFn: async (): Promise<MatchRow[]> => {
      const { data, error } = await supabase
        .from("matches")
        .select(MATCH_SELECT)
        .order("starts_at", { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []) as unknown as MatchRow[];
    },
  });
}

export function useMatch(matchId: string | undefined) {
  return useQuery({
    enabled: Boolean(matchId),
    queryKey: ["match", matchId],
    queryFn: async (): Promise<MatchRow | null> => {
      const { data, error } = await supabase.from("matches").select(MATCH_SELECT).eq("id", matchId!).maybeSingle();
      if (error) throw new Error(error.message);
      return (data ?? null) as unknown as MatchRow | null;
    },
  });
}

/** Matches the signed-in player created or joined. */
export function useMyMatches(userId: string | undefined) {
  return useQuery({
    enabled: Boolean(userId),
    queryKey: ["my-matches", userId],
    queryFn: async (): Promise<MatchRow[]> => {
      const { data: mine, error: mineError } = await supabase
        .from("match_players")
        .select("match_id")
        .eq("player_id", userId!);
      if (mineError) throw new Error(mineError.message);
      const ids = (mine ?? []).map((m) => m.match_id);
      if (ids.length === 0) return [];
      const { data, error } = await supabase
        .from("matches")
        .select(MATCH_SELECT)
        .in("id", ids)
        .order("starts_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as unknown as MatchRow[];
    },
  });
}

export type PlayerProfile = {
  id: string;
  display_name: string;
  initials: string;
  city: string;
  level_tier: LevelTier;
  level_points: number;
  avatar_url: string | null;
};

const PROFILE_SELECT = "id, display_name, initials, city, level_tier, level_points, avatar_url";

export function useProfiles(ids: string[]) {
  const key = [...new Set(ids)].sort().join(",");
  return useQuery({
    enabled: ids.length > 0,
    queryKey: ["profiles", key],
    queryFn: async (): Promise<Record<string, PlayerProfile>> => {
      const { data, error } = await supabase.from("profiles").select(PROFILE_SELECT).in("id", [...new Set(ids)]);
      if (error) throw new Error(error.message);
      const map: Record<string, PlayerProfile> = {};
      for (const p of (data ?? []) as unknown as PlayerProfile[]) map[p.id] = p;
      return map;
    },
  });
}

export function usePlayer(playerId: string | undefined) {
  return useQuery({
    enabled: Boolean(playerId),
    queryKey: ["player", playerId],
    queryFn: async (): Promise<PlayerProfile | null> => {
      const { data, error } = await supabase.from("profiles").select(PROFILE_SELECT).eq("id", playerId!).maybeSingle();
      if (error) throw new Error(error.message);
      return (data ?? null) as unknown as PlayerProfile | null;
    },
  });
}

export type AppNotification = {
  id: string;
  kind: string;
  title: string;
  body: string;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

export function useNotifications(userId: string | undefined) {
  return useQuery({
    enabled: Boolean(userId),
    queryKey: ["notifications", userId],
    queryFn: async (): Promise<AppNotification[]> => {
      const { data, error } = await supabase
        .from("notifications")
        .select("id, kind, title, body, link, read_at, created_at")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw new Error(error.message);
      return (data ?? []) as AppNotification[];
    },
  });
}

/** Win / loss / played totals derived from recorded results. */
export function playerStats(matches: MatchRow[], userId: string) {
  let played = 0;
  let wins = 0;
  let losses = 0;
  for (const m of matches) {
    const result = m.match_results?.[0];
    if (!result) continue;
    const me = m.match_players?.find((p) => p.player_id === userId);
    if (!me) continue;
    played += 1;
    if (me.side === result.winner_side) wins += 1;
    else losses += 1;
  }
  return { played, wins, losses };
}
