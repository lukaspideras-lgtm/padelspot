# PadelSpot – Launch Checklist

Pre objavljivanja aplikacije, prođi kroz sledeće stavke.

---

## 1. Backend

- [ ] Podesi backend od nule (Supabase, Firebase ili custom API)
- [ ] Konfiguriši `.env` sa URL-om i ključevima

---

## 2. Konfiguracija (.env)

- [ ] Kopiraj `.env.example` u `.env` (ako već nemaš)
- [ ] `EXPO_PUBLIC_SUPABASE_URL` – Production Supabase URL
- [ ] `EXPO_PUBLIC_SUPABASE_ANON_KEY` – Production anon key
- [ ] `.env` je u `.gitignore` ✅ (nikad ne commit-uj ključeve)

---

## 3. App Metadata (app.json)

- [ ] `name` – "Padel Spot" ili kako želiš da izgleda ime
- [ ] `version` – Trenutno 1.0.0
- [ ] `slug` – "padelspot" (za Expo URL)
- [ ] **Android** – Za Play Store dodaj `package` (npr. `rs.padelspot.app`):
  ```json
  "android": {
    "package": "rs.padelspot.app",
    ...
  }
  ```
- [ ] **Splash/ikonice** – Proveri da su konačne (splash, icon, adaptive-icon)

---

## 4. Funkcionalno testiranje

Prođi kroz `docs/TEST_CHECKLIST.md`:

- [ ] Rezervacija 1h – User A rezerviše, User B ne može na isti termin
- [ ] Rezervacija 2h – blokira oba sata
- [ ] Prošli termini – nisu izborivi
- [ ] Otkazivanje – radi samo ≥2h pre početka
- [ ] Admin panel – vidi sve rezervacije, može otkazati / no-show
- [ ] Blokade – admin može kreirati blokade
- [ ] 30 dana – nema rezervacija preko 30 dana unapred

---

## 5. UX & Edge Cases

- [ ] **Greške** – Svuda gde postoji API poziv, greška prikazuje toast (npr. "Termin je zauzet")
- [ ] **Loading** – Rezervacija, Učitavanje istorije – prikazuje se indikator
- [ ] **Offline** – `simulateOffline: false` u `constants/settings.ts` (za production)
- [ ] **Kalendar** – Dozvola i integracija rade (opciono, ali korisno)

---

## 6. Build za Google Play

### Opcija A: EAS Build (preporučeno)

1. **Expo nalog** – [expo.dev](https://expo.dev) – registruj se
2. **EAS CLI** – `npm install -g eas-cli`
3. **Login** – `eas login`
4. **Konfiguracija** – `eas build:configure` (kreira `eas.json`)
5. **Build** – `eas build --platform android --profile production`

### Opcija B: Lokalni build

```bash
npx expo prebuild
npx expo run:android
```

APK će biti u `android/app/build/outputs/apk/`.

---

## 7. Pre objave

- [ ] Testiraj na **realnom Android uređaju** (ne samo emulator)
- [ ] Proveri **dark i light** temu
- [ ] Proveri da **sve slike/logotipi** budu učitani (fontovi, logo)
- [ ] Proveri **Kontakt** – linkovi (telefon, Instagram, mapa) rade

---

## 8. Šta je već urađeno

- ✅ Autentifikacija (login, register)
- ✅ Rezervacije sa validacijom
- ✅ Admin panel (rezervacije, blokade, no-show)
- ✅ Profil, Istorija, Cenovnik
- ✅ Dark/Light tema
- ✅ Typography (Oswald, Montserrat)
- ✅ ErrorBoundary (expo-router)
- ✅ Toast za greške
- ✅ Kalendar integracija
