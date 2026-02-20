# PadelSpot – Manual Test Plan

Proveri da backend radi pre deploy-a.

## Preduslov

- `.env` sa `EXPO_PUBLIC_SUPABASE_URL` i `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `supabase/sql/init.sql` pokrenut u Supabase SQL Editor
- `npx expo start` pokrenut

## A) Kreiranje korisnika (registracija + OTP)

1. Otvori app → trebalo bi da vidiš Login
2. Klikni "Registrujte se"
3. Unesi: email, ime, prezime, telefon
4. Klikni "Registruj se"
5. Trebalo bi da te prebaci na "Potvrdite email"
6. Proveri inbox – trebalo bi da imaš 6-cifreni kod (ako je OTP template podešen)
7. Unesi kod → klikni "Potvrdi"
8. Trebalo bi da te prebaci na Rezervacija (tabs)

**Alternativa (password login):** Ako korisnik već ima lozinku (npr. postavljen u Supabase Dashboard), može se prijaviti direktno sa email + lozinka.

## B) List courts (mora vratiti barem 1)

1. Posle prijave, otvori tab "Rezervacija"
2. U sekciji "Teren" trebalo bi da vidiš barem jedan teren (Zeleni, Plavi, Narandžasti)
3. Ako je prazno → proveri RLS na `courts` i da li je init.sql seed izvršen

## C) Get availability

1. Izaberi datum (danas ili sutra)
2. Izaberi teren
3. Izaberi trajanje (1h ili 2h)
4. U "Dostupni termini" trebalo bi da vidiš listu slobodnih termina (npr. 09:00, 10:00, …)
5. Ako je prazno → proveri da li je `list_availability` RPC pozvan (network tab)

## D) Create reservation

1. Izaberi slobodan termin (npr. 18:00)
2. Klikni "Rezerviši" / "Nastavi"
3. Potvrdi (sa ili bez reketa)
4. Trebalo bi da vidiš success overlay
5. Proveri da nema greške "Termin je zauzet"

## E) listMine vidi rezervaciju

1. Otvori tab "Moje rezervacije"
2. Trebalo bi da vidiš upravo kreiranu rezervaciju u "Predstojeći"
3. Proveri da ima: teren, datum, vreme, status "Rezervisano"

## F) Cancel i proveri da je nestala

1. U "Moje rezervacije" klikni na rezervaciju (otkaz)
2. Potvrdi otkazivanje
3. Rezervacija treba da nestane iz "Predstojeći" (ili pređe u "Otkazani")
4. Vrati se na Rezervacija → isti termin treba da bude ponovo dostupan

## SQL queries za debug (Supabase SQL Editor)

```sql
-- 1) Da li ima courts?
SELECT id, name, is_active FROM courts;

-- 2) Da li ima korisnika u auth?
SELECT id, email, created_at FROM auth.users LIMIT 5;

-- 3) Da li ima profiles (kreira trigger)?
SELECT id, first_name, last_name, phone, role FROM profiles LIMIT 5;

-- 4) Rezervacije za danas
SELECT r.id, c.name, r.start_time, r.end_time, r.status
FROM reservations r JOIN courts c ON c.id = r.court_id
WHERE r.start_time::date = CURRENT_DATE
ORDER BY r.start_time;

-- 5) Postavi admin (zameni USER_UUID sa stvarnim id iz auth.users)
-- UPDATE profiles SET role = 'admin' WHERE id = 'USER_UUID';
```
