# Auth callback – Flow bez deep linka (bez spinning loop-a)

## Šta je novačinjeno

**auth-callback.html NIKAD ne otvara aplikaciju.** Umesto toga:

1. **auth-callback.html** čuva tokene u Supabase preko `store_pending_session(email, access_token, refresh_token)`
2. Prikazuje: „Nalog je potvrđen! Vratite se u aplikaciju Padel Spot.“
3. **App** (verify-email ekran) polluje `get_pending_session_for_email` svakih 2 s i preuzima sesiju
4. App automatski uloguje i preusmeri na Rezervacije

## KRITIČNO: Supabase Redirect URLs

**Proveri u Supabase Dashboard → Authentication → URL Configuration:**

- **Site URL** – trebalo bi da bude `https://padelpotvrda.com` (ili tvoj domen)
- **Redirect URLs** – MORA da sadrži: `https://padelpotvrda.com/auth-callback.html`

Ako ova URL nije u whitelist-u, Supabase može da preusmeri negde drugde (npr. na Site URL) i korisnik neće doći na naš auth-callback.

## Koraci za podešavanje

### 1. Pokreni SQL migraciju

U Supabase SQL Editor pokreni:

```
supabase/sql/migration_auth_pending_by_email.sql
```

### 2. GitHub Secrets (za deploy)

Ako koristiš GitHub Pages za auth-callback:

1. **Settings** → **Secrets and variables** → **Actions**
2. Dodaj:
   - `SUPABASE_URL` – tvoj Supabase projekat URL (npr. `https://xxx.supabase.co`)
   - `SUPABASE_ANON_KEY` – anon key iz Supabase Dashboard → Settings → API

3. Bez ovih secrets, auth-callback prikazuje grešku „Server nije pravilno podešen“.

### 3. Deploy auth-callback

Push na `auth-callback-deploy/` – GitHub Actions automatski deployuje.

### 4. EAS Update / novi build

```bash
eas update --branch production --platform android
```

## Provera

1. Registruj se u app
2. Ostani na ekranu „Potvrdite email“
3. Otvori email i klikni na link – otvori se u browseru
4. Trebalo bi da vidiš: „Nalog je potvrđen! Vratite se u aplikaciju...“
5. Vrati se u app – u roku par sekundi bićeš ulogovan i preusmeren na Rezervacije

**Ako i dalje bude spinning loop:** Proveri da li Supabase Redirect URLs sadrži `https://padelpotvrda.com/auth-callback.html`.
