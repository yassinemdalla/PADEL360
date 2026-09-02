import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const createBookingSchema = z.object({
  courtId: z.string().uuid(),
  startsAt: z.string().datetime({ offset: true }),
  durationMinutes: z.number().int().min(30).max(180).default(60),
});

const cancelBookingSchema = z.object({ bookingId: z.string().uuid() });

export const createBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => createBookingSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const startsAt = new Date(data.startsAt);
    const endsAt = new Date(startsAt.getTime() + data.durationMinutes * 60_000);

    if (endsAt.getTime() <= Date.now()) {
      throw new Error("That slot is already in the past.");
    }

    const { data: court, error: courtError } = await supabase
      .from("courts")
      .select("id, name, clubs(id, name, price_cents)")
      .eq("id", data.courtId)
      .maybeSingle();

    if (courtError) throw new Error(courtError.message);
    if (!court) throw new Error("That court no longer exists.");

    // Double-booking validation: any confirmed/pending booking whose window
    // overlaps the requested window blocks the reservation.
    const { data: clashes, error: clashError } = await supabase
      .from("bookings")
      .select("id")
      .eq("court_id", data.courtId)
      .neq("status", "cancelled")
      .lt("starts_at", endsAt.toISOString())
      .gt("ends_at", startsAt.toISOString())
      .limit(1);

    if (clashError) throw new Error(clashError.message);
    if (clashes && clashes.length > 0) {
      throw new Error("That court is already booked for this time. Pick another slot.");
    }

    const { data: blocks, error: blockError } = await supabase
      .from("court_blocks")
      .select("id, reason")
      .eq("court_id", data.courtId)
      .lt("starts_at", endsAt.toISOString())
      .gt("ends_at", startsAt.toISOString())
      .limit(1);

    if (blockError) throw new Error(blockError.message);
    if (blocks && blocks.length > 0) {
      throw new Error("The club has blocked this slot. Pick another slot.");
    }

    const club = (court as unknown as { clubs: { id: string; name: string; price_cents: number } | null }).clubs;

    const { data: booking, error } = await supabase
      .from("bookings")
      .insert({
        court_id: data.courtId,
        player_id: userId,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        status: "confirmed",
        price_cents: club?.price_cents ?? 3200,
      })
      .select("id, starts_at, ends_at, price_cents")
      .single();

    if (error) {
      // Database-level exclusion constraint: someone booked it a moment ago.
      if (error.code === "23P01") {
        throw new Error("That court was just booked by someone else. Pick another slot.");
      }
      throw new Error(error.message);
    }

    return {
      id: booking.id,
      startsAt: booking.starts_at,
      endsAt: booking.ends_at,
      priceCents: booking.price_cents,
      courtName: court.name,
      clubName: club?.name ?? "Club",
    };
  });

export const cancelBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => cancelBookingSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", data.bookingId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const logMatchSchema = z.object({
  bookingId: z.string().uuid(),
  opponent: z.string().trim().min(2).max(60),
  score: z.string().trim().min(3).max(30),
  result: z.enum(["WIN", "LOSS"]),
});

/** Turn a finished booking into a match result and nudge the player's level. */
export const logMatchFromBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => logMatchSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id, player_id, starts_at, ends_at, status, courts(name, clubs(name))")
      .eq("id", data.bookingId)
      .maybeSingle();

    if (bookingError) throw new Error(bookingError.message);
    if (!booking || booking.player_id !== userId) throw new Error("Booking not found.");
    if (booking.status === "cancelled") throw new Error("That booking was cancelled.");
    if (new Date(booking.ends_at).getTime() > Date.now()) {
      throw new Error("You can log the result once the match has finished.");
    }

    const court = booking.courts as unknown as { name: string; clubs: { name: string } | null } | null;
    const clubLabel = court?.clubs?.name ?? "Padel club";
    const levelDelta = data.result === "WIN" ? 0.05 : -0.03;

    const { data: match, error } = await supabase
      .from("matches")
      .insert({
        player_id: userId,
        played_on: booking.starts_at.slice(0, 10),
        opponent: data.opponent,
        score: data.score,
        result: data.result,
        club_label: clubLabel,
        level_delta: levelDelta,
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);

    const { data: profile } = await supabase
      .from("profiles")
      .select("level")
      .eq("id", userId)
      .maybeSingle();

    if (profile) {
      const next = Math.min(7, Math.max(1, Number(profile.level) + levelDelta));
      await supabase.from("profiles").update({ level: Number(next.toFixed(2)) }).eq("id", userId);
    }

    return { id: match.id, levelDelta };
  });
