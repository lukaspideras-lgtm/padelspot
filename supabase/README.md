# PadelSpot – Supabase Setup

## 1. Create project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Note your **Project URL** and **anon public** key (Project Settings → API).

## 2. Run SQL init

1. In Supabase Dashboard → SQL Editor, create a new query.
2. Copy the contents of `sql/init.sql` and run it.
3. Verify tables `profiles`, `courts`, `reservations` exist, and courts are seeded.

## 2b. Blocks + Admin migration (optional)

For blokade termina and improved admin panel:

1. Ensure `public.is_admin()` exists (from earlier fix).
2. Run `sql/migration_blocks_and_admin.sql` in SQL Editor.

## 3. Configure app

1. Copy `.env.example` to `.env`.
2. Set:
   - `EXPO_PUBLIC_SUPABASE_URL` = your Project URL
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY` = your anon key

## 4. Set first admin

Run in SQL Editor:

```sql
UPDATE profiles SET role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@example.com');
```

Replace `admin@example.com` with your admin user email.

## 5. Email verifikacija (Resend)

Za pouzdan email i bolji deliverability koristi Resend sa svojim domenom.

### 5a. Resend nalog

1. Kreiraj nalog na [resend.com](https://resend.com)
2. API Keys → napravi ključ
3. (Opciono) dodaj svoj domen i podesi DNS

### 5b. Supabase SMTP

Dashboard → **Project Settings** → **Authentication** → **SMTP Settings**:

- Enable Custom SMTP: **ON**
- Sender email: `noreply@tvoj-domen.com` (ili `onboarding@resend.dev` za testiranje)
- Sender name: `Padel Spot`
- Host: `smtp.resend.com`
- Port: `587`
- Username: `resend`
- Password: tvoj Resend API key

### 5c. Redirect URLs

Authentication → **URL Configuration** → **Redirect URLs**, dodaj:

- `https://padelpotvrda.com/auth-callback.html`
- `padelspot://auth/callback`
- `padelspot://**`

### 5d. Hostovanje auth-callback stranice

Fajl `auth-callback.html` mora biti dostupan na javnom URL-u (npr. `https://padelpotvrda.com/auth-callback.html`).

**Preporučeno: Vercel** – vidi [docs/AUTH_CALLBACK_DEPLOY.md](../docs/AUTH_CALLBACK_DEPLOY.md) za korak-po-korak.

```bash
cd auth-callback-deploy
vercel --prod
```

Zatim u Vercel Dashboard dodaj custom domain `padelpotvrda.com` i ažuriraj DNS u Namecheap prema uputstvima.

### 5e. Email template (lepši izgled)

Supabase Dashboard → **Authentication** → **Email Templates** → **Confirm signup**.

**Subject:** `Potvrdite registraciju – Padel Spot`

**Body (HTML):**

```html
<h2 style="color:#8dbc3f;font-family:sans-serif;">Padel Spot</h2>
<p style="font-family:sans-serif;">Zdravo,</p>
<p style="font-family:sans-serif;">Hvala na registraciji. Kliknite na dugme ispod da potvrdite nalog:</p>
<p><a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#8dbc3f;color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;font-family:sans-serif;">Potvrdi email</a></p>
<p style="font-family:sans-serif;font-size:12px;color:#666;">Link ostaje važeći 1 sat. Otvorite na telefonu gde je app instaliran.</p>
```

### 5f. Napomena

Link vodi na web stranicu koja zatim otvara app. Korisnik mora da ima Padel Spot instaliran na telefonu. Link ističe za 1 sat – ako istekne, korisnik može kliknuti „Pošalji ponovo”.
