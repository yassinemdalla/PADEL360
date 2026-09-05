import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { applyResult, LEVEL_TIERS, type LevelTier } from "@/lib/levels";

const tierEnum = z.enum(LEVEL_TIERS);

const createMatchSchema = z.object({
  clubId: z.string().uuid(),
  courtId: z.string().uuid().optional(),
  startsAt: z.string().datetime({ offset: true }),
  durationMinutes: z.number().int().min(60).max(180).default(90),
  levelRequired: tierEnum,
  maxPlayers: z.number().int().min(2).max(8).default(4),
  isPublic: z.boolean().default(true),
  notes: z.string().trim().max(280).default(""),
  bookCourt: z.boolean().default(false),
});

/** A player cannot hold two matches whose times overlap. */
async function assertNoOverlap(
  supabase: { from: (t: string) => any },
  userId: string,
  startsAt: Date,
  endsAt: Date,
  ignoreMatchId?: string,
) {
  const { data: mine, error } = await supabase
    .from("match_players")
    .select("match_id")
    .eq("player_id", userId);
  if (error) throw new Error(error.message);
  const ids = (mine ?? []).map((m: { match_id: string }) => m.match_id).filter((id: string) => id !== ignoreMatchId);
  if (ids.length === 0) return;
  const { data: clash, error: clashError } = await supabase
    .from("matches")
    .select("id")
    .in("id", ids)
    .lt("starts_at", endsAt.toISOString())
    .gt("ends_at", startsAt.toISOString())
    .limit(1);
  if (clashError) throw new Error(clashError.message);
  if (clash && clash.length > 0) throw new Error("You already have a match at that time.");
}

export const createMatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => createMatchSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const startsAt = new Date(data.startsAt);
    const endsAt = new Date(startsAt.getTime() + data.durationMinutes * 60_000);
    if (endsAt.getTime() <= Date.now()) throw new Error("Pick a time in the future.");

    await assertNoOverlap(supabase as never, userId, startsAt, endsAt);

    let bookingId: string | null = null;

    if (data.bookCourt && data.courtId) {
      const { data: court, error: courtError } = await supabase
        .from("courts")
        .select("id, price_per_hour_cents, open_from, open_to")
        .eq("id", data.courtId)
        .maybeSingle();
      if (courtError) throw new Error(courtError.message);
      if (!court) throw new Error("That court no longer exists.");

      const startHour = startsAt.getHours() + startsAt.getMinutes() / 60;
      const endHour = endsAt.getHours() + endsAt.getMinutes() / 60 || 24;
      if (startHour < court.open_from || endHour > court.open_to) {
        throw new Error(`This court is open ${court.open_from}:00 – ${court.open_to}:00.`);
      }

      const { data: clashes, error: clashError } = await supabase
        .from("bookings")
        .select("id")
        .eq("court_id", data.courtId)
        .neq("status", "cancelled")
        .lt("starts_at", endsAt.toISOString())
        .gt("ends_at", startsAt.toISOString())
        .limit(1);
      if (clashError) throw new Error(clashError.message);
      if (clashes && clashes.length > 0) throw new Error("That court is already booked for this time.");

      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .insert({
          court_id: data.courtId,
          player_id: userId,
          starts_at: startsAt.toISOString(),
          ends_at: endsAt.toISOString(),
          status: "confirmed",
          price_cents: court.price_per_hour_cents,
        })
        .select("id")
        .single();
      if (bookingError) throw new Error(bookingError.message);
      bookingId = booking.id;
    }

    const { data: match, error } = await supabase
      .from("matches")
      .insert({
        creator_id: userId,
        club_id: data.clubId,
        court_id: data.courtId ?? null,
        booking_id: bookingId,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        level_required: data.levelRequired,
        max_players: data.maxPlayers,
        is_public: data.isPublic,
        notes: data.notes,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    await supabase
      .from("match_players")
      .insert({ match_id: match.id, player_id: userId, status: "joined", side: 1 });

    await supabase.from("notifications").insert({
      user_id: userId,
      kind: "match_created",
      title: "Match created",
      body: `Your match on ${startsAt.toLocaleString()} is live. Players can join now.`,
      link: `/matches/${match.id}`,
    });

    return { id: match.id, bookingId };
  });

export const joinMatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ matchId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: match, error } = await supabase
      .from("matches")
      .select("id, creator_id, starts_at, ends_at, max_players, match_players(id, player_id, side)")
      .eq("id", data.matchId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!match) throw new Error("Match not found.");

    const players = (match.match_players ?? []) as { player_id: string; side: number | null }[];
    if (players.some((p) => p.player_id === userId)) throw new Error("You already joined this match.");
    if (players.length >= match.max_players) throw new Error("This match is full.");

    await assertNoOverlap(supabase as never, userId, new Date(match.starts_at), new Date(match.ends_at));

    const sideOne = players.filter((p) => p.side === 1).length;
    const sideTwo = players.filter((p) => p.side === 2).length;
    const side = sideOne <= sideTwo ? 1 : 2;

    const { error: joinError } = await supabase
      .from("match_players")
      .insert({ match_id: match.id, player_id: userId, status: "joined", side });
    if (joinError) throw new Error(joinError.message);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("notifications").insert({
      user_id: match.creator_id,
      kind: "match_joined",
      title: "A player joined your match",
      body: `Your match on ${new Date(match.starts_at).toLocaleString()} has ${players.length + 1} players.`,
      link: `/matches/${match.id}`,
    });

    return { ok: true, side };
  });

export const leaveMatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ matchId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: match } = await supabase
      .from("matches")
      .select("creator_id")
      .eq("id", data.matchId)
      .maybeSingle();
    if (match?.creator_id === userId) throw new Error("The creator can't leave their own match.");
    const { error } = await supabase
      .from("match_players")
      .delete()
      .eq("match_id", data.matchId)
      .eq("player_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const resultSchema = z.object({
  matchId: z.string().uuid(),
  winnerSide: z.union([z.literal(1), z.literal(2)]),
  scoreText: z.string().trim().min(3).max(40),
});

export const recordResult = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => resultSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: match, error } = await supabase
      .from("matches")
      .select("id, starts_at, ends_at, match_players(player_id, side), match_results(match_id)")
      .eq("id", data.matchId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!match) throw new Error("Match not found.");

    const players = (match.match_players ?? []) as { player_id: string; side: number | null }[];
    if (!players.some((p) => p.player_id === userId)) throw new Error("Only players in this match can record it.");
    const existing = (match.match_results ?? []) as unknown as { match_id: string }[];
    if (existing.length > 0) throw new Error("This match already has a result.");


    const { error: insertError } = await supabase.from("match_results").insert({
      match_id: match.id,
      winner_side: data.winnerSide,
      score_text: data.scoreText,
      recorded_by: userId,
    });
    if (insertError) throw new Error(insertError.message);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ids = players.map((p) => p.player_id);
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, level_tier, level_points")
      .in("id", ids);

    const moves: Record<string, { tier: LevelTier; points: number; delta: number; moved: string | null }> = {};

    for (const p of players) {
      const profile = (profiles ?? []).find((row) => row.id === p.player_id);
      if (!profile) continue;
      const won = p.side === data.winnerSide;
      const next = applyResult(profile.level_tier as LevelTier, Number(profile.level_points), won);
      moves[p.player_id] = next;
      await supabaseAdmin
        .from("profiles")
        .update({ level_tier: next.tier, level_points: next.points })
        .eq("id", p.player_id);
      await supabaseAdmin.from("notifications").insert({
        user_id: p.player_id,
        kind: "match_result",
        title: won ? "You won — level points added" : "Result recorded",
        body: `${data.scoreText} · ${next.delta >= 0 ? "+" : ""}${next.delta} points${
          next.moved === "up" ? " · promoted!" : next.moved === "down" ? " · level down" : ""
        }`,
        link: `/matches/${match.id}`,
      });
    }

    return { ok: true, me: moves[userId] ?? null };
  });
