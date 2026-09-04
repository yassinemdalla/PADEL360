CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, initials, city, level_tier)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    UPPER(LEFT(COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email), 2)),
    COALESCE(NEW.raw_user_meta_data->>'city', 'Sousse'),
    COALESCE((NEW.raw_user_meta_data->>'level_tier')::public.level_tier, 'intermediate')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP FUNCTION IF EXISTS public.has_role(uuid, app_role);
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TYPE IF EXISTS public.app_role;

DROP POLICY IF EXISTS clubs_update_own_manager ON public.clubs;
DROP POLICY IF EXISTS courts_manage_own_club ON public.courts;
DROP POLICY IF EXISTS bookings_select_own_or_manager ON public.bookings;
DROP POLICY IF EXISTS bookings_update_own_or_manager ON public.bookings;
DROP POLICY IF EXISTS bookings_delete_own_or_manager ON public.bookings;
CREATE POLICY bookings_select_own ON public.bookings FOR SELECT TO authenticated USING (auth.uid() = player_id);
CREATE POLICY bookings_update_own ON public.bookings FOR UPDATE TO authenticated USING (auth.uid() = player_id) WITH CHECK (auth.uid() = player_id);
CREATE POLICY bookings_delete_own ON public.bookings FOR DELETE TO authenticated USING (auth.uid() = player_id);
ALTER TABLE public.clubs DROP COLUMN IF EXISTS manager_id;

CREATE SCHEMA IF NOT EXISTS extensions;
ALTER EXTENSION btree_gist SET SCHEMA extensions;