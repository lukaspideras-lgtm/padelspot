# PadelSpot – mobilna aplikacija za rezervaciju padel terena

Frontend-only React Native + Expo mobilna aplikacija za rezervaciju padel terena. Interfejs je na srpskom jeziku (latinica).

## Tehnički stek

- **Expo SDK 54** + TypeScript
- **expo-router** – file-based routing
- **Zustand** – state management
- **Expo SecureStore / AsyncStorage** – persistovanje sesije („ostaje ulogovan“)
- **React Native** – native komponente
- **expo-linear-gradient** – gradijent pozadine

## Logo

**Logo mora biti izvezen sa transparentnom pozadinom** (PNG sa alpha kanalom) ili kao SVG. Koristite `./assets/images/logo.png`. Ako logo ima crnu pravougaonu pozadinu ugrađenu u piksele, kod je ne može ukloniti – izvezite logo sa transparentnom pozadinom u grafičkom editoru.

## Kako pokrenuti

```bash
# Instalacija zavisnosti
npm install

# Pokretanje aplikacije
npx expo start
```

Zatim:
- **Android**: Pritisnite `a` ili skenirajte QR kod sa Expo Go aplikacijom
- **iOS**: Pritisnite `i` (potreban Mac) ili skenirajte QR sa Expo Go
- **Web**: Pritisnite `w` za web verziju

## Struktura projekta

```
app/
├── _layout.tsx          # Root layout, AuthGuard, Toast
├── index.tsx            # Početna stranica (redirect na login ili tabs)
├── auth/
│   ├── _layout.tsx
│   ├── login.tsx
│   └── register.tsx
├── (tabs)/
│   ├── _layout.tsx
│   ├── index.tsx        # Redirect na reserve
│   ├── reserve.tsx      # Rezervacija terena
│   ├── my-reservations.tsx
│   ├── cenovnik.tsx     # Cenovnik
│   └── profile.tsx
├── admin.tsx            # Admin panel (samo za admin@padel.rs)
└── admin-forbidden.tsx  # Ekran kada korisnik nema pristup adminu

components/
├── AuthGuard.tsx        # Route guards (login required, admin check)
└── ui/
    ├── PrimaryButton.tsx
    ├── TextField.tsx
    ├── CourtSelector.tsx
    ├── CourtChips.tsx
    ├── DayStrip.tsx     # Neograničen horizontalni izbor dana (infinite scroll)
    ├── DurationToggle.tsx # 1h / 2h
    ├── PriceSummary.tsx
    ├── ScreenGradient.tsx
    ├── SlotList.tsx
    ├── ReservationCard.tsx
    ├── EmptyState.tsx
    └── Toast.tsx

store/
├── useAppStore.ts       # Zustand: korisnik, rezervacije, auth
└── useToastStore.ts     # Toast poruke

constants/
├── Colors.ts            # Branding: bela, gradijent, tamno siva surface
├── courts.ts            # Zeleni, Plavi, Narandžasti teren
├── times.ts             # generateSlots(), TIME_SLOTS_1H (bez 24:00–25:00)
└── pricing.ts           # Cenovnik i calculatePrice()

utils/
└── storage.ts           # SecureStore (mobilni) / AsyncStorage (web)
```

## Backend (Supabase)

Aplikacija koristi **Supabase** za auth, bazu i RPC pozive.

### Šta je bilo pokvareno

- Backend servisi (auth, courts, reservations, blocks) bili su mock – vraćali prazne podatke ili grešku „Backend nije podešen“.
- Supabase klijent i env varijable nisu bili podešeni.

### Kako pokrenuti lokalno (RUNBOOK)

1. **Instalacija**
   ```bash
   npm install
   ```

2. **Env varijable** – kopiraj `.env.example` u `.env` i popuni:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
   **Važno:** Expo učitava samo varijable sa prefiksom `EXPO_PUBLIC_`. Nemoj koristiti `SUPABASE_URL` bez prefiksa.

3. **Provera env** – pri startu app-a u dev modu, u konzoli treba da vidiš:
   ```
   [PadelSpot] Supabase config: { hasUrl: true, hasKey: true }
   ```
   Ako je `false` → `.env` nije učitan ili varijable nisu postavljene.

4. **Migracija** – u Supabase Dashboard → SQL Editor kopiraj **ceo** sadržaj `supabase/sql/init.sql` i klikni Run. Fajl je idempotent.

5. **OTP (opciono)** – u Supabase → Authentication → Email Templates podesi da body sadrži `{{ .Token }}` za 6-cifreni kod.

6. **Pokretanje**
   ```bash
   npx expo start
   ```

7. **Expo env cache** – kad menjaš `.env`, zaustavi Expo (Ctrl+C), pa:
   ```bash
   npx expo start -c
   ```
   Za Android: ako env i dalje ne radi, očisti Expo Go cache (Settings → Clear cache).

8. **Test** – vidi `docs/MANUAL_TEST_PLAN.md` (manual) i `docs/CURL_TEST.md` (6 curl komandi za dokaz)

### Endpointi koji sada rade

| Servis | Metoda | Supabase |
|--------|--------|----------|
| Auth | register, login, sendOtp, verifyOtp, getSession, getCurrentUser, logout | Supabase Auth + RPC check_phone_available |
| Courts | listActive() | `from('courts')` |
| Reservations | getAvailability, create, cancel, listMine, listAllForAdmin, adminCancelReservation, adminMarkNoShow | RPC list_availability, create_reservation, cancel_reservation, list_reservations_mine, list_reservations_admin, admin_cancel_reservation, admin_mark_no_show |
| Blocks | listForAdmin, createBlock, cancelBlock, getAdminDailyOverview, createBlocksBulk, cancelBlocksBulk | RPC list_blocks_admin, create_block, cancel_block, admin_daily_overview, create_blocks_bulk, cancel_blocks_bulk |

### RLS (Row Level Security)

| Tabela | RLS | Policies |
|--------|-----|----------|
| profiles | ✅ | SELECT/UPDATE owner; admins SELECT/UPDATE all |
| courts | ✅ | SELECT (authenticated, is_active=true) |
| reservations | ✅ | SELECT/INSERT owner; admins SELECT all |
| blocks | ✅ | SELECT/INSERT/UPDATE admin only |

Svi RPC-ovi su `SECURITY DEFINER` – izvršavaju se sa elevated pravima, validacija unutar funkcije.

### Admin – profiles i role

- **Trigger `handle_new_user`**: Pri INSERT u `auth.users`, automatski se kreira red u `profiles` (first_name, last_name, phone iz `raw_user_meta_data`). Ako je telefon već zauzet → `phone_taken` greška.
- **Da bi neko bio admin**: U Supabase → Table Editor → `profiles` postavi `role = 'admin'` za odgovarajući `id` (auth.users.id).

### Schema i RPC

- **Tabele i RPC nazivi**: vidi `docs/SCHEMA_REFERENCE.md`
- **Timezone**: Europe/Belgrade; sve konverzije u init.sql RPC-ovima (vidi `docs/RPC_REFERENCE.md`)

## Rute i zaštita

| Ruta | Pristup |
|------|---------|
| `/auth/login` | Javna |
| `/auth/register` | Javna |
| `/(tabs)/*` | Zahtevan login |
| `/admin` | Samo admin (admin@padel.rs) |
| `/admin-forbidden` | Prikazuje se kada ne-admin pokuša pristup adminu |

## Test nalog za admin

1. Registruj korisnika (npr. admin@padel.rs)
2. U Supabase → Table Editor → `profiles` nađi red sa tim `id` (auth.users)
3. Postavi `role = 'admin'`
4. Prijavi se ponovo – pristup admin panelu će raditi
