# Auth callback – Deploy (padelpotvrda.com)

Stranica `auth-callback.html` prima Supabase tokene i prosleđuje ih u app. Mora biti hostovana na javnom URL-u.

---

## Opcija A: GitHub Pages (automatski)

**1. GitHub Pages podešavanje**

U repozitorijumu **padelspot**:
- **Settings** → **Pages**
- **Source**: izaberi **GitHub Actions**

**2. Push koda**

Nakon što push-uješ ovaj projekat na GitHub, workflow će automatski deployovati auth-callback.
URL: `https://<username>.github.io/padelspot/auth-callback.html`

**3. Custom domain**

- **Settings** → **Pages** → **Custom domain**
- Unesi: `padelpotvrda.com` → **Save**
- Po potrebi ukloni domen iz starog repo (padelpotvrda-pages) ako je bio tamo

**4. DNS** – A zapisi u Namecheap već pokazuju na GitHub. Ako custom domain ne radi odmah, sačekaj 10–15 minuta.

---

## Opcija B: Vercel deploy

## Korak 1: Deploy na Vercel

1. Registruj se na [vercel.com](https://vercel.com) (besplatno).
2. Instaliraj Vercel CLI: `npm i -g vercel`
3. U terminalu (iz root projekta):
   ```bash
   npm run deploy:auth-callback
   ```
   ili ručno:
   ```bash
   cd auth-callback-deploy
   vercel --prod
   ```
4. Prati upite (link projekat sa GitHub-om ili deploy samo ovaj folder).
5. Po završetku dobijaš URL npr. `https://auth-callback-xxx.vercel.app/auth-callback.html`

## Korak 2: Custom domain (padelpotvrda.com)

1. Vercel Dashboard → tvoj projekat → **Settings** → **Domains**
2. Klikni **Add** i unesi: `padelpotvrda.com`
3. Vercel prikaže uputstva za DNS:
   - Za **apex** (padelpotvrda.com): dodaj A zapise za `76.76.21.21` (ili šta Vercel predloži)
   - Za **www**: CNAME `www` → `cname.vercel-dns.com`

4. U **Namecheap** (DNS):
   - Obriši stare A zapise za GitHub Pages (ako ih imaš)
   - Dodaj A zapise koje Vercel predloži za `@`
   - Ili CNAME za `www` prema Vercel uputstvima

5. Sačekaj 5–30 minuta – Vercel verifikuje domen i uključi HTTPS.

## Korak 3: Supabase

1. **Authentication** → **URL Configuration** → **Redirect URLs**
2. Dodaj: `https://padelpotvrda.com/auth-callback.html` (ili tvoj Vercel URL ako još nemaš domen)

## Korak 4: Aplikacija (.env)

U `.env` dodaj (ako koristiš drugačiji URL):

```
EXPO_PUBLIC_AUTH_CALLBACK_URL=https://padelpotvrda.com/auth-callback.html
```

Ako koristiš Vercel URL pre custom domena:

```
EXPO_PUBLIC_AUTH_CALLBACK_URL=https://tvoj-projekat.vercel.app/auth-callback.html
```

## Provera

1. Otvori `https://padelpotvrda.com/auth-callback.html` (ili tvoj Vercel URL)
2. Trebalo bi da vidiš „Potvrđujemo nalog...”
3. Registruj se u app – link iz emaila treba da vodi ovde i da otvori app
