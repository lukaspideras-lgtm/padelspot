-- =============================================================================
-- SVE POPRAVKE U JEDNOM – pokreni ceo fajl u Supabase SQL Editor
-- Rešava: "already exists", "cannot change return type", "database error saving new user"
-- =============================================================================

-- 0) Registracija – normalize_phone + handle_new_user (fix za "database error saving new user")
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_normalized text DEFAULT '';

CREATE OR REPLACE FUNCTION public.normalize_phone_input(p text)
RETURNS text AS $$
  SELECT regexp_replace(COALESCE(trim(p), ''), '\D', '', 'g');
$$ LANGUAGE sql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.sync_phone_normalized()
RETURNS TRIGGER AS $$
BEGIN
  NEW.phone_normalized := public.normalize_phone_input(NEW.phone);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_phone_normalized ON profiles;
CREATE TRIGGER trg_sync_phone_normalized
  BEFORE INSERT OR UPDATE OF phone ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_phone_normalized();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    'user'
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'phone_taken: Ovaj broj telefona je već u upotrebi.';
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 1) Tabela auth_pending_by_email (ako ne postoji)
CREATE TABLE IF NOT EXISTS auth_pending_by_email (
  email text PRIMARY KEY,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 2) store_pending_session + get_pending_session_for_email
DROP FUNCTION IF EXISTS store_pending_session(text, text, text);
CREATE OR REPLACE FUNCTION store_pending_session(p_email text, p_access_token text, p_refresh_token text)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO auth_pending_by_email (email, access_token, refresh_token)
  VALUES (lower(trim(p_email)), p_access_token, p_refresh_token)
  ON CONFLICT (email) DO UPDATE SET
    access_token = EXCLUDED.access_token,
    refresh_token = EXCLUDED.refresh_token,
    created_at = now();
  RETURN '{"ok":true}'::json;
END;
$$;
GRANT EXECUTE ON FUNCTION store_pending_session(text, text, text) TO anon;

CREATE OR REPLACE FUNCTION get_pending_session_for_email(p_email text)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_access_token text;
  v_refresh_token text;
BEGIN
  SELECT access_token, refresh_token INTO v_access_token, v_refresh_token
  FROM auth_pending_by_email
  WHERE email = lower(trim(p_email)) AND created_at > now() - interval '15 minutes';

  IF v_access_token IS NULL THEN
    RETURN NULL;
  END IF;

  DELETE FROM auth_pending_by_email WHERE email = lower(trim(p_email));

  RETURN json_build_object('access_token', v_access_token, 'refresh_token', v_refresh_token);
END;
$$;
GRANT EXECUTE ON FUNCTION get_pending_session_for_email(text) TO anon;

-- 3) profiles – policies
DROP POLICY IF EXISTS "users_select_own_profile" ON profiles;
CREATE POLICY "users_select_own_profile" ON profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "users_update_own_profile" ON profiles;
CREATE POLICY "users_update_own_profile" ON profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "admins_select_all_profiles" ON profiles;
CREATE POLICY "admins_select_all_profiles" ON profiles FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS "admins_update_all_profiles" ON profiles;
CREATE POLICY "admins_update_all_profiles" ON profiles FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- 4) blocks – policies (preskoči ako tabela blocks ne postoji)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'blocks') THEN
    DROP POLICY IF EXISTS "admins_select_blocks" ON blocks;
    CREATE POLICY "admins_select_blocks" ON blocks FOR SELECT USING (public.is_admin());
    DROP POLICY IF EXISTS "admins_insert_blocks" ON blocks;
    CREATE POLICY "admins_insert_blocks" ON blocks FOR INSERT WITH CHECK (public.is_admin());
    DROP POLICY IF EXISTS "admins_update_blocks" ON blocks;
    CREATE POLICY "admins_update_blocks" ON blocks FOR UPDATE USING (public.is_admin());
  END IF;
END $$;
