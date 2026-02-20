-- =============================================================================
-- PadelSpot – kompletna inicijalizacija (JEDAN FAJL)
-- =============================================================================
-- UPUTSTVO: Kopiraj CELI sadržaj ovog fajla u Supabase Dashboard → SQL Editor
--          i klikni "Run". Fajl je idempotent – može se pokrenuti više puta.
-- =============================================================================

-- Extensions (IF NOT EXISTS = idempotent)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- -----------------------------------------------------------------------------
-- 1) profiles
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text NOT NULL DEFAULT '',
  last_name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  phone_normalized text DEFAULT '',
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  no_show_count int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_normalized text DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS no_show_count int NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS has_seen_tutorial boolean NOT NULL DEFAULT false;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select_own_profile" ON profiles;
CREATE POLICY "users_select_own_profile" ON profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "users_update_own_profile" ON profiles;
CREATE POLICY "users_update_own_profile" ON profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "users_insert_own_profile" ON profiles;
CREATE POLICY "users_insert_own_profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Phone normalization
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

UPDATE profiles SET phone_normalized = public.normalize_phone_input(phone) WHERE phone_normalized = '' OR phone_normalized IS NULL;

DROP INDEX IF EXISTS profiles_phone_unique;
CREATE UNIQUE INDEX profiles_phone_unique ON profiles (phone_normalized)
  WHERE phone_normalized != '' AND length(phone_normalized) >= 9 AND phone_normalized != '0606921300';

-- -----------------------------------------------------------------------------
-- 2) courts
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS courts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  accent text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE courts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_select_active_courts" ON courts;
CREATE POLICY "authenticated_select_active_courts" ON courts FOR SELECT TO authenticated USING (is_active = true);

-- Seed: minimalno 2 aktivna terena (bez ovoga courts list vraća prazno)
INSERT INTO courts (name, accent, is_active) VALUES
  ('Zeleni teren', 'green', true),
  ('Plavi teren', 'blue', true),
  ('Narandžasti teren', 'orange', true)
ON CONFLICT (name) DO UPDATE SET is_active = EXCLUDED.is_active;

-- -----------------------------------------------------------------------------
-- 3) reservations
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  court_id uuid NOT NULL REFERENCES courts(id),
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  duration_minutes int NOT NULL CHECK (duration_minutes IN (60, 120)),
  status text NOT NULL DEFAULT 'booked' CHECK (status IN ('booked', 'cancelled', 'no_show')),
  racket boolean NOT NULL DEFAULT false,
  price_din int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT chk_end_after_start CHECK (end_time > start_time),
  CONSTRAINT chk_duration_matches CHECK (EXTRACT(EPOCH FROM (end_time - start_time)) / 60 = duration_minutes)
);

ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION check_reservation_overlap()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'booked' THEN
    IF EXISTS (SELECT 1 FROM reservations r WHERE r.court_id = NEW.court_id AND r.id IS DISTINCT FROM NEW.id AND r.status = 'booked'
      AND tstzrange(r.start_time, r.end_time, '[)') && tstzrange(NEW.start_time, NEW.end_time, '[)')) THEN
      RAISE EXCEPTION 'conflict_overlap: Termin je zauzet. Izaberite drugi.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_reservation_overlap ON reservations;
CREATE TRIGGER trg_reservation_overlap BEFORE INSERT OR UPDATE ON reservations FOR EACH ROW EXECUTE FUNCTION check_reservation_overlap();

DROP POLICY IF EXISTS "users_select_own_reservations" ON reservations;
CREATE POLICY "users_select_own_reservations" ON reservations FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "users_insert_own_reservations" ON reservations;
CREATE POLICY "users_insert_own_reservations" ON reservations FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "admins_select_all_reservations" ON reservations;
CREATE POLICY "admins_select_all_reservations" ON reservations FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- -----------------------------------------------------------------------------
-- 4) blocks
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  court_id uuid NOT NULL REFERENCES courts(id),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  duration_minutes int NOT NULL CHECK (duration_minutes IN (60, 120)),
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT chk_block_end_after_start CHECK (end_time > start_time),
  CONSTRAINT chk_block_duration_matches CHECK (EXTRACT(EPOCH FROM (end_time - start_time)) / 60 = duration_minutes)
);

ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION check_block_overlap()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'active' THEN
    IF EXISTS (SELECT 1 FROM blocks b WHERE b.court_id = NEW.court_id AND b.id IS DISTINCT FROM NEW.id AND b.status = 'active'
      AND tstzrange(b.start_time, b.end_time, '[)') && tstzrange(NEW.start_time, NEW.end_time, '[)')) THEN
      RAISE EXCEPTION 'block_overlap: Blokada se preklapa sa postojećom.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_block_overlap ON blocks;
CREATE TRIGGER trg_block_overlap BEFORE INSERT OR UPDATE ON blocks FOR EACH ROW EXECUTE FUNCTION check_block_overlap();

-- -----------------------------------------------------------------------------
-- 5) Helper: is_admin
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin');
$$;

DROP POLICY IF EXISTS "admins_select_blocks" ON blocks;
CREATE POLICY "admins_select_blocks" ON blocks FOR SELECT USING (public.is_admin());
DROP POLICY IF EXISTS "admins_insert_blocks" ON blocks;
CREATE POLICY "admins_insert_blocks" ON blocks FOR INSERT WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "admins_update_blocks" ON blocks;
CREATE POLICY "admins_update_blocks" ON blocks FOR UPDATE USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- 5b) RPC: list_reservations_mine
-- SECURITY DEFINER | Tabele: reservations, courts, auth.users
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION list_reservations_mine()
RETURNS TABLE (id uuid, user_email text, court_name text, date_iso text, start_time text, end_time text, status text, created_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  SELECT r.id, u.email::text, c.name::text, (r.start_time AT TIME ZONE 'Europe/Belgrade')::date::text,
    to_char(r.start_time AT TIME ZONE 'Europe/Belgrade', 'HH24:MI'),
    to_char(r.end_time AT TIME ZONE 'Europe/Belgrade', 'HH24:MI'),
    CASE r.status WHEN 'booked' THEN 'Rezervisano' WHEN 'cancelled' THEN 'Otkazano' WHEN 'no_show' THEN 'Otkazano' ELSE r.status END,
    r.created_at
  FROM reservations r
  JOIN courts c ON c.id = r.court_id
  JOIN auth.users u ON u.id = r.user_id
  WHERE r.user_id = auth.uid()
  ORDER BY r.start_time DESC;
END;
$$;

-- -----------------------------------------------------------------------------
-- 6) RPC: list_availability
-- SECURITY DEFINER | Tabele: reservations, blocks
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION list_availability(date_iso text, court_id uuid, duration_minutes int)
RETURNS text[]
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE d date; h int; start_ts timestamptz; end_ts timestamptz; result text[] := '{}'; dur interval; cutoff timestamptz;
BEGIN
  IF duration_minutes NOT IN (60, 120) THEN RETURN '{}'; END IF;
  d := date_iso::date; dur := (duration_minutes || ' minutes')::interval; cutoff := now();
  FOR h IN 9..(CASE WHEN duration_minutes = 60 THEN 23 ELSE 22 END) LOOP
    start_ts := ((d::text || ' ' || lpad(h::text, 2, '0') || ':00:00')::timestamp) AT TIME ZONE 'Europe/Belgrade';
    end_ts := start_ts + dur;
    IF d = ((cutoff AT TIME ZONE 'Europe/Belgrade')::date) AND start_ts < cutoff THEN CONTINUE; END IF;
    IF EXISTS (SELECT 1 FROM reservations r WHERE r.court_id = list_availability.court_id AND r.status = 'booked'
      AND tstzrange(r.start_time, r.end_time, '[)') && tstzrange(start_ts, end_ts, '[)')) THEN CONTINUE; END IF;
    IF EXISTS (SELECT 1 FROM blocks b WHERE b.court_id = list_availability.court_id AND b.status = 'active'
      AND tstzrange(b.start_time, b.end_time, '[)') && tstzrange(start_ts, end_ts, '[)')) THEN CONTINUE; END IF;
    result := result || (lpad(h::text, 2, '0') || ':00');
  END LOOP;
  RETURN result;
END;
$$;

-- -----------------------------------------------------------------------------
-- 7) RPC: create_reservation, cancel_reservation
-- SECURITY DEFINER | Tabele: courts, reservations
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION create_reservation(p_court_id uuid, p_date_iso text, p_start_hhmm text, p_duration_minutes int, p_racket boolean DEFAULT false)
RETURNS reservations
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user_id uuid; v_date date; v_start_ts timestamptz; v_end_ts timestamptz; v_price int; v_row reservations; v_min_date date; v_max_date date;
  v_hour int; v_min int; v_dow int; v_is_weekend boolean; v_hourly_rate int; v_h int;
BEGIN
  v_user_id := auth.uid(); IF v_user_id IS NULL THEN RAISE EXCEPTION 'auth_required: Morate biti ulogovani.'; END IF;
  IF NOT EXISTS (SELECT 1 FROM courts WHERE id = p_court_id AND is_active = true) THEN RAISE EXCEPTION 'invalid_court: Teren nije pronađen ili nije aktivan.'; END IF;
  IF p_duration_minutes NOT IN (60, 120) THEN RAISE EXCEPTION 'invalid_duration: Trajanje mora biti 60 ili 120 minuta.'; END IF;
  v_date := p_date_iso::date; v_min_date := (now() AT TIME ZONE 'Europe/Belgrade')::date; v_max_date := v_min_date + interval '30 days';
  IF v_date < v_min_date OR v_date > v_max_date THEN RAISE EXCEPTION 'booking_window: Rezervacije su dostupne do 30 dana unapred.'; END IF;
  v_hour := split_part(p_start_hhmm, ':', 1)::int; v_min := split_part(p_start_hhmm, ':', 2)::int;
  IF v_min != 0 THEN RAISE EXCEPTION 'invalid_start: Rezervacija mora početi na sat.'; END IF;
  IF v_hour < 9 OR (v_hour > 23) OR (p_duration_minutes = 120 AND v_hour > 22) THEN RAISE EXCEPTION 'invalid_hours: Radno vreme je 09:00–24:00.'; END IF;
  v_start_ts := ((v_date::text || ' ' || p_start_hhmm || ':00')::timestamp) AT TIME ZONE 'Europe/Belgrade';
  v_end_ts := v_start_ts + (p_duration_minutes || ' minutes')::interval;
  IF v_start_ts < now() THEN RAISE EXCEPTION 'past_time: Termin je u prošlosti.'; END IF;
  v_price := 0; v_dow := EXTRACT(DOW FROM v_date)::int; v_is_weekend := v_dow IN (0, 6);
  FOR v_h IN 0..(p_duration_minutes / 60 - 1) LOOP
    v_hour := EXTRACT(HOUR FROM (v_start_ts + (v_h * interval '1 hour')) AT TIME ZONE 'Europe/Belgrade');
    v_hourly_rate := CASE WHEN v_hour >= 18 AND v_hour <= 23 THEN CASE WHEN v_is_weekend THEN 3000 ELSE 2400 END ELSE CASE WHEN v_is_weekend THEN 2600 ELSE 2000 END END;
    v_price := v_price + v_hourly_rate;
  END LOOP;
  IF p_racket THEN v_price := v_price + 300; END IF;
  INSERT INTO reservations (user_id, court_id, start_time, end_time, duration_minutes, status, racket, price_din)
  VALUES (v_user_id, p_court_id, v_start_ts, v_end_ts, p_duration_minutes, 'booked', p_racket, v_price) RETURNING * INTO v_row;
  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION cancel_reservation(p_reservation_id uuid)
RETURNS reservations
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_row reservations;
BEGIN
  SELECT * INTO v_row FROM reservations WHERE id = p_reservation_id AND user_id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'not_found: Rezervacija nije pronađena.'; END IF;
  IF v_row.status != 'booked' THEN RAISE EXCEPTION 'already_cancelled: Rezervacija je već otkazana.'; END IF;
  IF now() > v_row.start_time - interval '2 hours' THEN RAISE EXCEPTION 'cancel_too_late: Termin se ne može otkazati manje od 2h pre početka.'; END IF;
  UPDATE reservations SET status = 'cancelled' WHERE id = p_reservation_id RETURNING * INTO v_row; RETURN v_row;
END;
$$;

-- -----------------------------------------------------------------------------
-- 8) RPC: check_phone_available
-- SECURITY DEFINER | Tabele: profiles | GRANT anon (registracija pre login-a)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION check_phone_available(p_phone text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_normalized text; v_exists boolean;
BEGIN
  v_normalized := public.normalize_phone_input(p_phone);
  IF v_normalized = '' OR length(v_normalized) < 9 THEN RETURN true; END IF;
  IF v_normalized = '0606921300' THEN RETURN true; END IF;
  SELECT EXISTS (SELECT 1 FROM profiles WHERE phone_normalized = v_normalized) INTO v_exists;
  RETURN NOT v_exists;
END;
$$;
REVOKE ALL ON FUNCTION check_phone_available(text) FROM public;
GRANT EXECUTE ON FUNCTION check_phone_available(text) TO anon;

-- -----------------------------------------------------------------------------
-- 9) RPC: list_reservations_admin
-- SECURITY DEFINER | Tabele: profiles, reservations, courts
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION list_reservations_admin(p_date_iso text, p_search text DEFAULT NULL)
RETURNS TABLE (id uuid, court_name text, start_time timestamptz, end_time timestamptz, duration_minutes int, status text, price_din int, racket boolean, first_name text, last_name text, phone text, no_show_count int)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'admin_required: Pristup samo za administratore.'; END IF;
  RETURN QUERY
  SELECT r.id, c.name AS court_name, r.start_time, r.end_time, r.duration_minutes, r.status, r.price_din, r.racket,
    COALESCE(p.first_name, '')::text, COALESCE(p.last_name, '')::text, COALESCE(p.phone, '')::text, COALESCE(p.no_show_count, 0)::int
  FROM reservations r JOIN courts c ON c.id = r.court_id LEFT JOIN public.profiles p ON p.id = r.user_id
  WHERE r.start_time::date = p_date_iso::date
    AND (p_search IS NULL OR trim(p_search) = '' OR (lower(COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, '')) LIKE '%' || lower(trim(p_search)) || '%' OR lower(replace(COALESCE(p.phone, ''), ' ', '')) LIKE '%' || lower(replace(trim(p_search), ' ', '')) || '%'))
  ORDER BY r.start_time;
END;
$$;

-- -----------------------------------------------------------------------------
-- 10) RPC: admin_cancel_reservation, admin_mark_no_show
-- SECURITY DEFINER | Tabele: profiles, reservations
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION admin_cancel_reservation(p_reservation_id uuid)
RETURNS reservations
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_row reservations;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'admin_required: Pristup samo za administratore.'; END IF;
  SELECT * INTO v_row FROM reservations WHERE id = p_reservation_id; IF NOT FOUND THEN RAISE EXCEPTION 'not_found: Rezervacija nije pronađena.'; END IF;
  IF v_row.status != 'booked' THEN RAISE EXCEPTION 'already_processed: Rezervacija je već otkazana ili obrađena.'; END IF;
  UPDATE reservations SET status = 'cancelled' WHERE id = p_reservation_id RETURNING * INTO v_row; RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION admin_mark_no_show(p_reservation_id uuid)
RETURNS reservations
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_row reservations;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'admin_required: Pristup samo za administratore.'; END IF;
  SELECT * INTO v_row FROM reservations WHERE id = p_reservation_id; IF NOT FOUND THEN RAISE EXCEPTION 'not_found: Rezervacija nije pronađena.'; END IF;
  IF v_row.status != 'booked' THEN RAISE EXCEPTION 'already_processed: Rezervacija je već obrađena.'; END IF;
  UPDATE reservations SET status = 'no_show' WHERE id = p_reservation_id RETURNING * INTO v_row;
  UPDATE public.profiles SET no_show_count = no_show_count + 1 WHERE id = v_row.user_id;
  RETURN v_row;
END;
$$;

-- -----------------------------------------------------------------------------
-- 11) RPC: list_blocks_admin, create_block, cancel_block
-- SECURITY DEFINER | Tabele: profiles, blocks, courts, reservations
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION list_blocks_admin(p_date_iso text)
RETURNS TABLE (id uuid, court_name text, start_time timestamptz, end_time timestamptz, duration_minutes int, reason text, status text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'admin_required: Pristup samo za administratore.'; END IF;
  RETURN QUERY SELECT b.id, c.name AS court_name, b.start_time, b.end_time, b.duration_minutes, b.reason, b.status
  FROM blocks b JOIN courts c ON c.id = b.court_id WHERE b.start_time::date = p_date_iso::date ORDER BY b.start_time;
END;
$$;

CREATE OR REPLACE FUNCTION create_block(p_court_id uuid, p_date_iso text, p_start_hhmm text, p_duration_minutes int, p_reason text)
RETURNS blocks
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_admin_id uuid; v_date date; v_start_ts timestamptz; v_end_ts timestamptz; v_hour int; v_min int; v_row blocks; v_min_date date; v_max_date date;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'admin_required: Pristup samo za administratore.'; END IF;
  v_admin_id := auth.uid(); IF v_admin_id IS NULL THEN RAISE EXCEPTION 'auth_required: Morate biti ulogovani.'; END IF;
  IF p_duration_minutes NOT IN (60, 120) THEN RAISE EXCEPTION 'invalid_duration: Trajanje mora biti 60 ili 120 minuta.'; END IF;
  IF COALESCE(TRIM(p_reason), '') = '' THEN RAISE EXCEPTION 'reason_required: Unesite razlog blokade.'; END IF;
  v_date := p_date_iso::date; v_min_date := (now() AT TIME ZONE 'Europe/Belgrade')::date; v_max_date := v_min_date + interval '30 days';
  IF v_date < v_min_date OR v_date > v_max_date THEN RAISE EXCEPTION 'booking_window: Blokade su dozvoljene za sledećih 30 dana.'; END IF;
  v_hour := split_part(p_start_hhmm, ':', 1)::int; v_min := split_part(p_start_hhmm, ':', 2)::int;
  IF v_min != 0 THEN RAISE EXCEPTION 'invalid_start: Blokada mora početi na sat.'; END IF;
  IF v_hour < 9 OR (v_hour > 23) OR (p_duration_minutes = 120 AND v_hour > 22) THEN RAISE EXCEPTION 'invalid_hours: Radno vreme je 09:00–24:00.'; END IF;
  v_start_ts := ((v_date::text || ' ' || p_start_hhmm || ':00')::timestamp) AT TIME ZONE 'Europe/Belgrade';
  v_end_ts := v_start_ts + (p_duration_minutes || ' minutes')::interval;
  IF v_start_ts < now() THEN RAISE EXCEPTION 'past_time: Termin je u prošlosti.'; END IF;
  IF EXISTS (SELECT 1 FROM reservations r WHERE r.court_id = p_court_id AND r.status = 'booked' AND tstzrange(r.start_time, r.end_time, '[)') && tstzrange(v_start_ts, v_end_ts, '[)')) THEN
    RAISE EXCEPTION 'conflict_reservation: Na ovom terminu postoji rezervacija. Otkažite je pre blokade.';
  END IF;
  INSERT INTO blocks (court_id, created_by, start_time, end_time, duration_minutes, reason, status) VALUES (p_court_id, v_admin_id, v_start_ts, v_end_ts, p_duration_minutes, TRIM(p_reason), 'active') RETURNING * INTO v_row;
  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION cancel_block(p_block_id uuid)
RETURNS blocks
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_row blocks;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'admin_required: Pristup samo za administratore.'; END IF;
  SELECT * INTO v_row FROM blocks WHERE id = p_block_id; IF NOT FOUND THEN RAISE EXCEPTION 'not_found: Blokada nije pronađena.'; END IF;
  IF v_row.status != 'active' THEN RAISE EXCEPTION 'already_cancelled: Blokada je već uklonjena.'; END IF;
  UPDATE blocks SET status = 'cancelled' WHERE id = p_block_id RETURNING * INTO v_row; RETURN v_row;
END;
$$;

-- -----------------------------------------------------------------------------
-- 12) RPC: admin_daily_overview, create_blocks_bulk, cancel_blocks_bulk
-- SECURITY DEFINER | Tabele: profiles, courts, reservations, blocks
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION admin_daily_overview(p_date_iso text)
RETURNS TABLE (court_id uuid, court_name text, total_slots int, filled_slots int)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_court RECORD; v_total int := 15; v_filled int;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'admin_required: Pristup samo za administratore.'; END IF;
  FOR v_court IN SELECT id, name FROM courts WHERE is_active = true LOOP
    SELECT COALESCE((SELECT sum(slots)::int FROM (SELECT (r.duration_minutes / 60) AS slots FROM reservations r WHERE r.court_id = v_court.id AND r.start_time::date = p_date_iso::date AND r.status IN ('booked', 'no_show') UNION ALL SELECT (b.duration_minutes / 60) AS slots FROM blocks b WHERE b.court_id = v_court.id AND b.start_time::date = p_date_iso::date AND b.status = 'active') t), 0) INTO v_filled;
    RETURN QUERY SELECT v_court.id, v_court.name::text, v_total, LEAST(v_filled, v_total);
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION create_blocks_bulk(p_court_id uuid, p_date_iso text, p_start_times text[], p_duration_minutes int, p_reason text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_admin_id uuid; v_date date; v_start_hhmm text; v_start_ts timestamptz; v_end_ts timestamptz; v_inserted int := 0; v_conflicts int := 0; v_hour int; v_min int; v_min_date date; v_max_date date;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'admin_required: Pristup samo za administratore.'; END IF;
  v_admin_id := auth.uid(); IF v_admin_id IS NULL THEN RAISE EXCEPTION 'auth_required: Morate biti ulogovani.'; END IF;
  IF p_duration_minutes NOT IN (60, 120) THEN RAISE EXCEPTION 'invalid_duration: Trajanje mora biti 60 ili 120 minuta.'; END IF;
  IF COALESCE(TRIM(p_reason), '') = '' THEN RAISE EXCEPTION 'reason_required: Unesite razlog blokade.'; END IF;
  v_date := p_date_iso::date; v_min_date := (now() AT TIME ZONE 'Europe/Belgrade')::date; v_max_date := v_min_date + interval '30 days';
  IF v_date < v_min_date OR v_date > v_max_date THEN RAISE EXCEPTION 'booking_window: Blokade su dozvoljene za sledećih 30 dana.'; END IF;
  FOREACH v_start_hhmm IN ARRAY p_start_times LOOP
    v_hour := split_part(v_start_hhmm, ':', 1)::int; v_min := split_part(v_start_hhmm, ':', 2)::int;
    IF v_min != 0 OR v_hour < 9 OR (v_hour > 23) OR (p_duration_minutes = 120 AND v_hour > 22) THEN v_conflicts := v_conflicts + 1; CONTINUE; END IF;
    v_start_ts := ((v_date::text || ' ' || v_start_hhmm || ':00')::timestamp) AT TIME ZONE 'Europe/Belgrade'; v_end_ts := v_start_ts + (p_duration_minutes || ' minutes')::interval;
    IF v_start_ts < now() THEN v_conflicts := v_conflicts + 1; CONTINUE; END IF;
    IF EXISTS (SELECT 1 FROM reservations r WHERE r.court_id = p_court_id AND r.status = 'booked' AND tstzrange(r.start_time, r.end_time, '[)') && tstzrange(v_start_ts, v_end_ts, '[)')) OR EXISTS (SELECT 1 FROM blocks b WHERE b.court_id = p_court_id AND b.status = 'active' AND tstzrange(b.start_time, b.end_time, '[)') && tstzrange(v_start_ts, v_end_ts, '[)')) THEN v_conflicts := v_conflicts + 1; CONTINUE; END IF;
    INSERT INTO blocks (court_id, created_by, start_time, end_time, duration_minutes, reason, status) VALUES (p_court_id, v_admin_id, v_start_ts, v_end_ts, p_duration_minutes, TRIM(p_reason), 'active');
    v_inserted := v_inserted + 1;
  END LOOP;
  RETURN jsonb_build_object('inserted', v_inserted, 'conflicts', v_conflicts);
END;
$$;

CREATE OR REPLACE FUNCTION cancel_blocks_bulk(p_block_ids uuid[])
RETURNS int
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_count int := 0; v_id uuid;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'admin_required: Pristup samo za administratore.'; END IF;
  FOREACH v_id IN ARRAY p_block_ids LOOP
    UPDATE blocks SET status = 'cancelled' WHERE id = v_id AND status = 'active'; IF FOUND THEN v_count := v_count + 1; END IF;
  END LOOP;
  RETURN v_count;
END;
$$;

-- -----------------------------------------------------------------------------
-- 13) Trigger: handle_new_user (profile sa phone_taken)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, phone, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'first_name', ''), COALESCE(NEW.raw_user_meta_data->>'last_name', ''), COALESCE(NEW.raw_user_meta_data->>'phone', ''), 'user');
  RETURN NEW;
EXCEPTION WHEN unique_violation THEN
  RAISE EXCEPTION 'phone_taken: Ovaj broj telefona je već u upotrebi.';
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 14) RPC SECURITY – REVOKE public, GRANT authenticated (check_phone_available → anon)
-- Svi RPC-ovi su SECURITY DEFINER sa SET search_path = public
-- -----------------------------------------------------------------------------
REVOKE ALL ON FUNCTION list_availability(text, uuid, int) FROM public;
REVOKE ALL ON FUNCTION create_reservation(uuid, text, text, int, boolean) FROM public;
REVOKE ALL ON FUNCTION cancel_reservation(uuid) FROM public;
REVOKE ALL ON FUNCTION list_reservations_mine() FROM public;
REVOKE ALL ON FUNCTION list_reservations_admin(text, text) FROM public;
REVOKE ALL ON FUNCTION admin_cancel_reservation(uuid) FROM public;
REVOKE ALL ON FUNCTION admin_mark_no_show(uuid) FROM public;
REVOKE ALL ON FUNCTION list_blocks_admin(text) FROM public;
REVOKE ALL ON FUNCTION create_block(uuid, text, text, int, text) FROM public;
REVOKE ALL ON FUNCTION cancel_block(uuid) FROM public;
REVOKE ALL ON FUNCTION admin_daily_overview(text) FROM public;
REVOKE ALL ON FUNCTION create_blocks_bulk(uuid, text, text[], int, text) FROM public;
REVOKE ALL ON FUNCTION cancel_blocks_bulk(uuid[]) FROM public;

GRANT EXECUTE ON FUNCTION list_availability(text, uuid, int) TO authenticated;
GRANT EXECUTE ON FUNCTION create_reservation(uuid, text, text, int, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION cancel_reservation(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION list_reservations_mine() TO authenticated;
GRANT EXECUTE ON FUNCTION list_reservations_admin(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_cancel_reservation(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_mark_no_show(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION list_blocks_admin(text) TO authenticated;
GRANT EXECUTE ON FUNCTION create_block(uuid, text, text, int, text) TO authenticated;
GRANT EXECUTE ON FUNCTION cancel_block(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_daily_overview(text) TO authenticated;
GRANT EXECUTE ON FUNCTION create_blocks_bulk(uuid, text, text[], int, text) TO authenticated;
GRANT EXECUTE ON FUNCTION cancel_blocks_bulk(uuid[]) TO authenticated;
