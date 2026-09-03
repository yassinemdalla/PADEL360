import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { dayBounds } from "./slots";

export type Court = {
  id: string;
  club_id: string;
  name: string;
  position: number;
  description: string;
  surface: string;
};

export type Club = {
  id: string;
  name: string;
  location_label: string;
  price_cents: number;
  manager_id: string | null;
  description: string | null;
  photo_url: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  courts: Court[];
};

const CLUB_SELECT =
  "id, name, location_label, price_cents, manager_id, description, photo_url, address, latitude, longitude, courts(id, club_id, name, position, description, surface)";

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

export function useMyClub(userId: string | undefined) {
  return useQuery({
    enabled: Boolean(userId),
    queryKey: ["my-club", userId],
    queryFn: async (): Promise<Club | null> => {
      const { data, error } = await supabase
        .from("clubs")
        .select(CLUB_SELECT)
        .eq("manager_id", userId!)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data ? sortCourts(data as unknown as Club) : null;
    },
  });
}

export type Occupancy = {
  bookings: { id: string; court_id: string; starts_at: string; ends_at: string; player_id: string; status: string; price_cents: number }[];
  blocks: { id: string; court_id: string; starts_at: string; ends_at: string; reason: string }[];
};

/** Bookings + manager holds for a set of courts on a single day. */
export function useDayOccupancy(courtIds: string[], day: Date) {
  const { from, to } = dayBounds(day);
  return useQuery({
    enabled: courtIds.length > 0,
    queryKey: ["occupancy", courtIds.join(","), from.toISOString()],
    queryFn: async (): Promise<Occupancy> => {
      const [bookings, blocks] = await Promise.all([
        supabase
          .from("bookings")
          .select("id, court_id, starts_at, ends_at, player_id, status, price_cents")
          .in("court_id", courtIds)
          .neq("status", "cancelled")
          .gte("starts_at", from.toISOString())
          .lt("starts_at", to.toISOString()),
        supabase
          .from("court_blocks")
          .select("id, court_id, starts_at, ends_at, reason")
          .in("court_id", courtIds)
          .gte("starts_at", from.toISOString())
          .lt("starts_at", to.toISOString()),
      ]);
      if (bookings.error) throw new Error(bookings.error.message);
      if (blocks.error) throw new Error(blocks.error.message);
      return { bookings: bookings.data ?? [], blocks: blocks.data ?? [] };
    },
  });
}

export type MyBooking = {
  id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  price_cents: number;
  courts: { id: string; name: string; clubs: { id: string; name: string; location_label: string } | null } | null;
};

export function useMyBookings(userId: string | undefined) {
  return useQuery({
    enabled: Boolean(userId),
    queryKey: ["my-bookings", userId],
    queryFn: async (): Promise<MyBooking[]> => {
      const { data, error } = await supabase
        .from("bookings")
        .select("id, starts_at, ends_at, status, price_cents, courts(id, name, clubs(id, name, location_label))")
        .eq("player_id", userId!)
        .order("starts_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as unknown as MyBooking[];
    },
  });
}

export function useBooking(bookingId: string | undefined) {
  return useQuery({
    enabled: Boolean(bookingId),
    queryKey: ["booking", bookingId],
    queryFn: async (): Promise<MyBooking | null> => {
      const { data, error } = await supabase
        .from("bookings")
        .select("id, starts_at, ends_at, status, price_cents, courts(id, name, clubs(id, name, location_label))")
        .eq("id", bookingId!)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return (data ?? null) as unknown as MyBooking | null;
    },
  });
}

export type Match = {
  id: string;
  played_on: string;
  opponent: string;
  score: string;
  result: string;
  club_label: string;
  level_delta: number;
};

export function useMyMatches(userId: string | undefined) {
  return useQuery({
    enabled: Boolean(userId),
    queryKey: ["my-matches", userId],
    queryFn: async (): Promise<Match[]> => {
      const { data, error } = await supabase
        .from("matches")
        .select("id, played_on, opponent, score, result, club_label, level_delta")
        .eq("player_id", userId!)
        .order("played_on", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []).map((m) => ({ ...m, level_delta: Number(m.level_delta) }));
    },
  });
}

export type PlayerProfile = {
  id: string;
  display_name: string;
  initials: string;
  level: number;
  style: string;
  avatar_url: string | null;
};

export function usePlayers(excludeUserId: string | undefined) {
  return useQuery({
    queryKey: ["players"],
    queryFn: async (): Promise<PlayerProfile[]> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, initials, level, style, avatar_url")
        .order("display_name");
      if (error) throw new Error(error.message);
      return (data ?? [])
        .map((p) => ({ ...p, level: Number(p.level) }))
        .filter((p) => p.id !== excludeUserId);
    },
  });
}

export type CourtReview = {
  id: string;
  court_id: string;
  player_id: string;
  surface_rating: number;
  lighting_rating: number;
  crowd_rating: number;
  comment: string;
  created_at: string;
  profiles: { display_name: string; initials: string } | null;
};

/** Reviews for a set of courts (club profile + manager view). */
export function useCourtReviews(courtIds: string[]) {
  const key = [...courtIds].sort().join(",");
  return useQuery({
    enabled: courtIds.length > 0,
    queryKey: ["court-reviews", key],
    queryFn: async (): Promise<CourtReview[]> => {
      const { data, error } = await supabase
        .from("court_reviews")
        .select(
          "id, court_id, player_id, surface_rating, lighting_rating, crowd_rating, comment, created_at, profiles(display_name, initials)",
        )
        .in("court_id", courtIds)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as unknown as CourtReview[];
    },
  });
}

export type BookingInvite = {
  id: string;
  booking_id: string;
  inviter_id: string;
  invitee_id: string;
  status: string;
  bookings: {
    id: string;
    starts_at: string;
    ends_at: string;
    courts: { name: string; clubs: { name: string; location_label: string } | null } | null;
  } | null;
};

const INVITE_SELECT =
  "id, booking_id, inviter_id, invitee_id, status, bookings(id, starts_at, ends_at, courts(name, clubs(name, location_label)))";

/** Invites the signed-in player received. */
export function useInvitesReceived(userId: string | undefined) {
  return useQuery({
    enabled: Boolean(userId),
    queryKey: ["invites-received", userId],
    queryFn: async (): Promise<BookingInvite[]> => {
      const { data, error } = await supabase
        .from("booking_invites")
        .select(INVITE_SELECT)
        .eq("invitee_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as unknown as BookingInvite[];
    },
  });
}

/** Invites the signed-in player sent, for their own bookings. */
export function useInvitesSent(userId: string | undefined) {
  return useQuery({
    enabled: Boolean(userId),
    queryKey: ["invites-sent", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("booking_invites")
        .select("id, booking_id, invitee_id, status, profiles:invitee_id(display_name, initials)")
        .eq("inviter_id", userId!);
      if (error) throw new Error(error.message);
      return (data ?? []) as unknown as {
        id: string;
        booking_id: string;
        invitee_id: string;
        status: string;
        profiles: { display_name: string; initials: string } | null;
      }[];
    },
  });
}

/** A single player's public profile. */
export function usePlayer(playerId: string | undefined) {
  return useQuery({
    enabled: Boolean(playerId),
    queryKey: ["player", playerId],
    queryFn: async (): Promise<PlayerProfile | null> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, initials, level, style, avatar_url")
        .eq("id", playerId!)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data ? { ...data, level: Number(data.level) } : null;
    },
  });
}

/** Public match history for any player. */
export function usePlayerMatches(playerId: string | undefined) {
  return useQuery({
    enabled: Boolean(playerId),
    queryKey: ["player-matches", playerId],
    queryFn: async (): Promise<Match[]> => {
      const { data, error } = await supabase
        .from("matches")
        .select("id, played_on, opponent, score, result, club_label, level_delta")
        .eq("player_id", playerId!)
        .order("played_on", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []).map((m) => ({ ...m, level_delta: Number(m.level_delta) }));
    },
  });
}
