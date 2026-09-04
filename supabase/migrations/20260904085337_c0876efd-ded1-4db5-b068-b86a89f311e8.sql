-- Clean up club-manager era tables
DROP TABLE IF EXISTS public.booking_invites CASCADE;
DROP TABLE IF EXISTS public.court_reviews CASCADE;
DROP TABLE IF EXISTS public.court_blocks CASCADE;
DROP TABLE IF EXISTS public.matches CASCADE;

-- Level tiers
DO $$ BEGIN
  CREATE TYPE public.level_tier AS ENUM ('beginner','improver','intermediate','advanced','competitor','elite','expert');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS city text NOT NULL DEFAULT 'Sousse',
  ADD COLUMN IF NOT EXISTS level_tier public.level_tier NOT NULL DEFAULT 'intermediate',
  ADD COLUMN IF NOT EXISTS level_points integer NOT NULL DEFAULT 0;

ALTER TABLE public.courts
  ADD COLUMN IF NOT EXISTS court_type text NOT NULL DEFAULT 'outdoor',
  ADD COLUMN IF NOT EXISTS price_per_hour_cents integer NOT NULL DEFAULT 3200,
  ADD COLUMN IF NOT EXISTS open_from smallint NOT NULL DEFAULT 8,
  ADD COLUMN IF NOT EXISTS open_to smallint NOT NULL DEFAULT 23;

UPDATE public.courts SET court_type = CASE WHEN position % 2 = 0 THEN 'indoor' ELSE 'outdoor' END;

ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS city text NOT NULL DEFAULT 'Sousse';

-- Matches (open games)
CREATE TABLE public.matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  court_id uuid REFERENCES public.courts(id) ON DELETE SET NULL,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  level_required public.level_tier NOT NULL DEFAULT 'intermediate',
  max_players smallint NOT NULL DEFAULT 4,
  is_public boolean NOT NULL DEFAULT true,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.matches TO authenticated;
GRANT ALL ON public.matches TO service_role;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY matches_select_authenticated ON public.matches FOR SELECT TO authenticated USING (true);
CREATE POLICY matches_insert_own ON public.matches FOR INSERT TO authenticated WITH CHECK (auth.uid() = creator_id);
CREATE POLICY matches_update_creator ON public.matches FOR UPDATE TO authenticated USING (auth.uid() = creator_id) WITH CHECK (auth.uid() = creator_id);
CREATE POLICY matches_delete_creator ON public.matches FOR DELETE TO authenticated USING (auth.uid() = creator_id);
CREATE TRIGGER matches_updated_at BEFORE UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Match players
CREATE TABLE public.match_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'joined',
  side smallint,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (match_id, player_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.match_players TO authenticated;
GRANT ALL ON public.match_players TO service_role;
ALTER TABLE public.match_players ENABLE ROW LEVEL SECURITY;
CREATE POLICY match_players_select_authenticated ON public.match_players FOR SELECT TO authenticated USING (true);
CREATE POLICY match_players_insert_self_or_creator ON public.match_players FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = player_id OR EXISTS (SELECT 1 FROM public.matches m WHERE m.id = match_id AND m.creator_id = auth.uid()));
CREATE POLICY match_players_update_self_or_creator ON public.match_players FOR UPDATE TO authenticated
  USING (auth.uid() = player_id OR EXISTS (SELECT 1 FROM public.matches m WHERE m.id = match_id AND m.creator_id = auth.uid()))
  WITH CHECK (auth.uid() = player_id OR EXISTS (SELECT 1 FROM public.matches m WHERE m.id = match_id AND m.creator_id = auth.uid()));
CREATE POLICY match_players_delete_self_or_creator ON public.match_players FOR DELETE TO authenticated
  USING (auth.uid() = player_id OR EXISTS (SELECT 1 FROM public.matches m WHERE m.id = match_id AND m.creator_id = auth.uid()));

-- Match results
CREATE TABLE public.match_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL UNIQUE REFERENCES public.matches(id) ON DELETE CASCADE,
  winner_side smallint NOT NULL,
  score_text text NOT NULL,
  recorded_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recorded_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.match_results TO authenticated;
GRANT ALL ON public.match_results TO service_role;
ALTER TABLE public.match_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY match_results_select_authenticated ON public.match_results FOR SELECT TO authenticated USING (true);
CREATE POLICY match_results_insert_participant ON public.match_results FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = recorded_by AND EXISTS (SELECT 1 FROM public.match_players mp WHERE mp.match_id = match_id AND mp.player_id = auth.uid()));
CREATE POLICY match_results_update_recorder ON public.match_results FOR UPDATE TO authenticated
  USING (auth.uid() = recorded_by) WITH CHECK (auth.uid() = recorded_by);

-- Notifications (in-app)
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  link text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY notifications_select_own ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY notifications_insert_own ON public.notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY notifications_update_own ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY notifications_delete_own ON public.notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS matches_starts_at_idx ON public.matches (starts_at);
CREATE INDEX IF NOT EXISTS match_players_player_idx ON public.match_players (player_id);
CREATE INDEX IF NOT EXISTS notifications_user_idx ON public.notifications (user_id, created_at DESC);