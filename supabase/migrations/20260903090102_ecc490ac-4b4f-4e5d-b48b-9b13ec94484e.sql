CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TABLE public.booking_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  inviter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT booking_invites_status_check CHECK (status IN ('pending','accepted','declined')),
  CONSTRAINT booking_invites_unique UNIQUE (booking_id, invitee_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.booking_invites TO authenticated;
GRANT ALL ON public.booking_invites TO service_role;

ALTER TABLE public.booking_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "booking_invites_select_involved" ON public.booking_invites
  FOR SELECT TO authenticated
  USING (auth.uid() = inviter_id OR auth.uid() = invitee_id);

CREATE POLICY "booking_invites_insert_inviter" ON public.booking_invites
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = inviter_id AND EXISTS (
    SELECT 1 FROM public.bookings b WHERE b.id = booking_id AND b.player_id = auth.uid()
  ));

CREATE POLICY "booking_invites_update_involved" ON public.booking_invites
  FOR UPDATE TO authenticated
  USING (auth.uid() = inviter_id OR auth.uid() = invitee_id)
  WITH CHECK (auth.uid() = inviter_id OR auth.uid() = invitee_id);

CREATE POLICY "booking_invites_delete_inviter" ON public.booking_invites
  FOR DELETE TO authenticated
  USING (auth.uid() = inviter_id);

CREATE TABLE public.court_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  court_id uuid NOT NULL REFERENCES public.courts(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  surface_rating smallint NOT NULL,
  lighting_rating smallint NOT NULL,
  crowd_rating smallint NOT NULL,
  comment text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT court_reviews_surface_range CHECK (surface_rating BETWEEN 1 AND 5),
  CONSTRAINT court_reviews_lighting_range CHECK (lighting_rating BETWEEN 1 AND 5),
  CONSTRAINT court_reviews_crowd_range CHECK (crowd_rating BETWEEN 1 AND 5),
  CONSTRAINT court_reviews_unique UNIQUE (court_id, player_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.court_reviews TO authenticated;
GRANT ALL ON public.court_reviews TO service_role;

ALTER TABLE public.court_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "court_reviews_select_authenticated" ON public.court_reviews
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "court_reviews_insert_own" ON public.court_reviews
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = player_id);

CREATE POLICY "court_reviews_update_own" ON public.court_reviews
  FOR UPDATE TO authenticated USING (auth.uid() = player_id) WITH CHECK (auth.uid() = player_id);

CREATE POLICY "court_reviews_delete_own" ON public.court_reviews
  FOR DELETE TO authenticated USING (auth.uid() = player_id);

CREATE TRIGGER update_booking_invites_updated_at BEFORE UPDATE ON public.booking_invites
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_court_reviews_updated_at BEFORE UPDATE ON public.court_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();