-- store_pending_session mora da vraća JSON da browser ne baca "unexpected end of JSON input"
-- Pokreni u Supabase SQL Editor

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
