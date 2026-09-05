import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const createBookingSchema = z.object({
  courtId: z.string().uuid(),
  startsAt: z.string().datetime({ offset: true }),
  durationMinutes: z.number().int().min(60).max(180).default(60),
});

const cancelBookingSchema = z.object({ bookingId: z.string().uuid() });

export const createBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => createBookingSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const startsAt = new Date(data.startsAt);
    const endsAt = new Date(startsAt.getTime() + data.durationMinutes * 60_000);

    if (endsAt.getTime() <= Date.now()) throw new Error("That slot is already in the past.");

    const { data: court, error: courtError } = await supabase
      .from("courts")
      .select("id, name, price_per_hour_cents, open_from, open_to, clubs(id, name)")
      .eq("id", data.courtId)
      .maybeSingle();

    if (courtError) throw new Error(courtError.message);
    if (!court) throw new Error("That court no longer exists.");

    // Bookings must sit inside the court's configured open hours.
    const startHour = startsAt.getHours() + startsAt.getMinutes() / 60;
    const endHour = endsAt.getHours() + endsAt.getMinutes() / 60 || 24;
    if (startHour < court.open_from || endHour > court.open_to) {
      throw new Error(`This court is open ${court.open_from}:00 – ${court.open_to}:00.`);
    }

    // Double-booking validation: any live booking overlapping the window blocks it.
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

    const club = (court as unknown as { clubs: { id: string; name: string } | null }).clubs;

    const { data: booking, error } = await supabase
      .from("bookings")
      .insert({
        court_id: data.courtId,
        player_id: userId,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        status: "confirmed",
        price_cents: court.price_per_hour_cents,
      })
      .select("id, starts_at, ends_at, price_cents")
      .single();

    if (error) {
      if (error.code === "23P01") {
        throw new Error("That court was just booked by someone else. Pick another slot.");
      }
      throw new Error(error.message);
    }

    await supabase.from("notifications").insert({
      user_id: userId,
      kind: "booking_confirmed",
      title: "Booking confirmed",
      body: `${court.name} at ${club?.name ?? "your club"} — ${new Date(booking.starts_at).toLocaleString()}`,
      link: "/home",
    });

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
