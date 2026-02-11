-- =============================================================================
-- Auth potvrda BEZ deep linka – čuvanje sesije po emailu, app polluje
-- auth-callback.html čuva tokene, verify-email screen polluje
-- Pokreni u Supabase SQL Editor
-- =============================================================================

-- Tabela: pending sesije po emailu (jedna upotreba, 15 min)
CREATE TABLE IF NOT EXISTS auth_pending_by_email (
  email text PRIMARY KEY,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- RPC: sačuvaj sesiju za email (poziva auth-callback.html)
CREATE OR REPLACE FUNCTION store_pending_session(p_email text, p_access_token text, p_refresh_token text)
RETURNS void
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
END;
$$;

-- RPC: uzmi i obriši sesiju za email (poziva app)
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

GRANT EXECUTE ON FUNCTION store_pending_session(text, text, text) TO anon;
GRANT EXECUTE ON FUNCTION get_pending_session_for_email(text) TO anon;
