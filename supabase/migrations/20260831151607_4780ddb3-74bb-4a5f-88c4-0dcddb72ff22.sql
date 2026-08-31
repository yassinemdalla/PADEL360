CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TYPE public.app_role AS ENUM ('player', 'club_manager');

-- profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT 'Player',
  initials text NOT NULL DEFAULT 'PB',
  level numeric(2,1) NOT NULL DEFAULT 3.0,
  style text NOT NULL DEFAULT 'Baseline',
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- roles
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles_select_own" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- clubs
CREATE TABLE public.clubs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location_label text NOT NULL DEFAULT 'Nearby',
  price_cents integer NOT NULL DEFAULT 3200,
  manager_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.clubs TO authenticated;
GRANT ALL ON public.clubs TO service_role;
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clubs_select_authenticated" ON public.clubs FOR SELECT TO authenticated USING (true);
CREATE POLICY "clubs_update_own_manager" ON public.clubs FOR UPDATE TO authenticated USING (auth.uid() = manager_id) WITH CHECK (auth.uid() = manager_id);

-- courts
CREATE TABLE public.courts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  name text NOT NULL,
  position integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX courts_club_id_idx ON public.courts(club_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.courts TO authenticated;
GRANT ALL ON public.courts TO service_role;
ALTER TABLE public.courts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "courts_select_authenticated" ON public.courts FOR SELECT TO authenticated USING (true);
CREATE POLICY "courts_manage_own_club" ON public.courts FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.clubs c WHERE c.id = courts.club_id AND c.manager_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.clubs c WHERE c.id = courts.club_id AND c.manager_id = auth.uid()));

-- bookings
CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  court_id uuid NOT NULL REFERENCES public.courts(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'confirmed',
  price_cents integer NOT NULL DEFAULT 3200,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bookings_time_order CHECK (ends_at > starts_at),
  CONSTRAINT bookings_status_valid CHECK (status IN ('confirmed', 'pending', 'cancelled')),
  CONSTRAINT bookings_no_overlap EXCLUDE USING gist (
    court_id WITH =,
    tstzrange(starts_at, ends_at) WITH &&
  ) WHERE (status <> 'cancelled')
);
CREATE INDEX bookings_player_idx ON public.bookings(player_id);
CREATE INDEX bookings_court_time_idx ON public.bookings(court_id, starts_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bookings_select_own_or_manager" ON public.bookings FOR SELECT TO authenticated
  USING (
    auth.uid() = player_id
    OR EXISTS (
      SELECT 1 FROM public.courts ct JOIN public.clubs c ON c.id = ct.club_id
      WHERE ct.id = bookings.court_id AND c.manager_id = auth.uid()
    )
  );
CREATE POLICY "bookings_insert_own" ON public.bookings FOR INSERT TO authenticated WITH CHECK (auth.uid() = player_id);
CREATE POLICY "bookings_update_own_or_manager" ON public.bookings FOR UPDATE TO authenticated
  USING (
    auth.uid() = player_id
    OR EXISTS (
      SELECT 1 FROM public.courts ct JOIN public.clubs c ON c.id = ct.club_id
      WHERE ct.id = bookings.court_id AND c.manager_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = player_id
    OR EXISTS (
      SELECT 1 FROM public.courts ct JOIN public.clubs c ON c.id = ct.club_id
      WHERE ct.id = bookings.court_id AND c.manager_id = auth.uid()
    )
  );
CREATE POLICY "bookings_delete_own_or_manager" ON public.bookings FOR DELETE TO authenticated
  USING (
    auth.uid() = player_id
    OR EXISTS (
      SELECT 1 FROM public.courts ct JOIN public.clubs c ON c.id = ct.club_id
      WHERE ct.id = bookings.court_id AND c.manager_id = auth.uid()
    )
  );

-- manager holds / maintenance blocks
CREATE TABLE public.court_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  court_id uuid NOT NULL REFERENCES public.courts(id) ON DELETE CASCADE,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  reason text NOT NULL DEFAULT 'Hold',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT court_blocks_time_order CHECK (ends_at > starts_at),
  CONSTRAINT court_blocks_no_overlap EXCLUDE USING gist (
    court_id WITH =,
    tstzrange(starts_at, ends_at) WITH &&
  )
);
CREATE INDEX court_blocks_court_time_idx ON public.court_blocks(court_id, starts_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.court_blocks TO authenticated;
GRANT ALL ON public.court_blocks TO service_role;
ALTER TABLE public.court_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "court_blocks_select_authenticated" ON public.court_blocks FOR SELECT TO authenticated USING (true);
CREATE POLICY "court_blocks_manage_own_club" ON public.court_blocks FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.courts ct JOIN public.clubs c ON c.id = ct.club_id
    WHERE ct.id = court_blocks.court_id AND c.manager_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.courts ct JOIN public.clubs c ON c.id = ct.club_id
    WHERE ct.id = court_blocks.court_id AND c.manager_id = auth.uid()
  ));

-- matches
CREATE TABLE public.matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  played_on date NOT NULL DEFAULT current_date,
  opponent text NOT NULL,
  score text NOT NULL,
  result text NOT NULL,
  club_label text NOT NULL DEFAULT '',
  level_delta numeric(3,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT matches_result_valid CHECK (result IN ('WIN', 'LOSS', 'DRAW'))
);
CREATE INDEX matches_player_idx ON public.matches(player_id, played_on DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.matches TO authenticated;
GRANT ALL ON public.matches TO service_role;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "matches_manage_own" ON public.matches FOR ALL TO authenticated
  USING (auth.uid() = player_id) WITH CHECK (auth.uid() = player_id);

-- new user bootstrap
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_name text;
  v_role public.app_role;
  v_initials text;
  v_club_id uuid;
BEGIN
  v_name := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data ->> 'display_name'), ''), split_part(NEW.email, '@', 1));
  v_role := CASE WHEN NEW.raw_user_meta_data ->> 'role' = 'club_manager' THEN 'club_manager'::public.app_role ELSE 'player'::public.app_role END;
  v_initials := UPPER(LEFT(REGEXP_REPLACE(v_name, '[^A-Za-z]', '', 'g') || 'X', 2));

  INSERT INTO public.profiles (id, display_name, initials)
  VALUES (NEW.id, v_name, v_initials)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, v_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  IF v_role = 'club_manager' THEN
    INSERT INTO public.clubs (name, location_label, price_cents, manager_id)
    VALUES (v_name || '''s Padel Club', 'Your club', 3200, NEW.id)
    RETURNING id INTO v_club_id;

    INSERT INTO public.courts (club_id, name, position) VALUES
      (v_club_id, 'Court 1', 1),
      (v_club_id, 'Court 2', 2),
      (v_club_id, 'Court 3', 3);
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- demo clubs so booking works right away
INSERT INTO public.clubs (id, name, location_label, price_cents) VALUES
  ('11111111-1111-4111-8111-111111111111', 'Riverside Padel Club', '1.2 km', 3200),
  ('22222222-2222-4222-8222-222222222222', 'Aramán Indoor', '3.5 km', 2800),
  ('33333333-3333-4333-8333-333333333333', 'Northgate Courts', '5.1 km', 2400);

INSERT INTO public.courts (club_id, name, position) VALUES
  ('11111111-1111-4111-8111-111111111111', 'Court 1', 1),
  ('11111111-1111-4111-8111-111111111111', 'Court 2', 2),
  ('11111111-1111-4111-8111-111111111111', 'Court 3', 3),
  ('11111111-1111-4111-8111-111111111111', 'Court 4', 4),
  ('22222222-2222-4222-8222-222222222222', 'Court 1', 1),
  ('22222222-2222-4222-8222-222222222222', 'Court 2', 2),
  ('22222222-2222-4222-8222-222222222222', 'Court 3', 3),
  ('33333333-3333-4333-8333-333333333333', 'Court 1', 1),
  ('33333333-3333-4333-8333-333333333333', 'Court 2', 2),
  ('33333333-3333-4333-8333-333333333333', 'Court 3', 3);