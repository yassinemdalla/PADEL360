import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const inviteSchema = z.object({
  bookingId: z.string().uuid(),
  inviteeId: z.string().uuid(),
});

/** Invite another player to share one of your bookings. */
export const inviteToBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => inviteSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (data.inviteeId === userId) throw new Error("You are already on this booking.");

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id, player_id, status")
      .eq("id", data.bookingId)
      .maybeSingle();

    if (bookingError) throw new Error(bookingError.message);
    if (!booking || booking.player_id !== userId) throw new Error("Booking not found.");
    if (booking.status === "cancelled") throw new Error("That booking was cancelled.");

    const { error } = await supabase.from("booking_invites").insert({
      booking_id: data.bookingId,
      inviter_id: userId,
      invitee_id: data.inviteeId,
      status: "pending",
    });

    if (error) {
      if (error.code === "23505") throw new Error("That player is already invited.");
      throw new Error(error.message);
    }
    return { ok: true };
  });

const respondSchema = z.object({
  inviteId: z.string().uuid(),
  status: z.enum(["accepted", "declined"]),
});

/** Accept or decline an invite you received. */
export const respondToInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => respondSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("booking_invites")
      .update({ status: data.status })
      .eq("id", data.inviteId)
      .eq("invitee_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const reviewSchema = z.object({
  courtId: z.string().uuid(),
  surface: z.number().int().min(1).max(5),
  lighting: z.number().int().min(1).max(5),
  crowd: z.number().int().min(1).max(5),
  comment: z.string().trim().max(400).default(""),
});

/** Create or update the signed-in player's review for a court. */
export const upsertCourtReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => reviewSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("court_reviews").upsert(
      {
        court_id: data.courtId,
        player_id: userId,
        surface_rating: data.surface,
        lighting_rating: data.lighting,
        crowd_rating: data.crowd,
        comment: data.comment,
      },
      { onConflict: "court_id,player_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const profileSchema = z.object({
  displayName: z.string().trim().min(2).max(40),
  style: z.string().trim().min(2).max(30),
  avatarUrl: z.string().trim().url().max(500).or(z.literal("")),
});

/** Update the signed-in player's own profile. */
export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => profileSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const initials = data.displayName
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("");

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: data.displayName,
        style: data.style,
        avatar_url: data.avatarUrl || null,
        initials: initials || "P",
      })
      .eq("id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
