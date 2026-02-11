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

### 2. Supabase vrednosti u auth-callback

Vrednosti su već u `auth-callback-deploy/auth-callback.html`. Ako menjaš Supabase projekat:

```bash
npm run inject:auth-callback
git add auth-callback-deploy/auth-callback.html
git commit -m "Update Supabase config"
git push
```

### 3. Deploy auth-callback

Push na `auth-callback-deploy/` – GitHub Actions automatski deployuje.

**Ako vidiš „Server nije pravilno podešen“:**
1. GitHub → **Actions** → **Deploy auth-callback to GitHub Pages** → **Run workflow** (ručno pokreni)
2. Očisti keš u browseru (Ctrl+Shift+Delete) ili otvori link u **incognito/private** prozoru

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

## Troubleshooting

| Problem | Rešenje |
|---------|---------|
| „Server nije pravilno podešen“ | 1. Ručno pokreni workflow (Actions → Run workflow) 2. Probaj incognito/private prozor 3. Proveri da li GitHub Pages koristi „Deploy from GitHub Actions“ (Settings → Pages) |
| „Link je istekao“ | Linkovi ističu za ~1h. Klikni „Pošalji ponovo“ na verify-email ekranu. |
| „Greška pri čuvanju“ | Proveri da li je `migration_auth_pending_by_email.sql` pokrenut u Supabase. |
