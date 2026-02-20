# PadelSpot – RPC Reference

Svi RPC-ovi su `SECURITY DEFINER`. Validacija i greške su unutar funkcija.

## Timezone (Europe/Belgrade)

- **Baza**: `start_time`, `end_time` u tabelama `reservations` i `blocks` su `timestamptz` (UTC interno).
- **Konverzija**: Svi RPC-ovi koriste `AT TIME ZONE 'Europe/Belgrade'` za datum/vreme u Srbiji.
- **Frontend**: Prima ISO string (`2025-02-20T18:00:00+01:00`) ili `date_iso` (yyyy-mm-dd) + `start_time` (HH:mm). Konverzija se dešava u init.sql RPC-ovima – frontend šalje `date_iso` i `start_hhmm`, backend parsira u Europe/Belgrade.

## list_availability

```
list_availability(date_iso text, court_id uuid, duration_minutes int) → text[]
```

- **Parametri**: datum (yyyy-mm-dd), id terena, 60 ili 120
- **Return**: niz stringova `["09:00","10:00",...]` – slobodni počeci termina
- **Validacija**: duration IN (60,120); isključuje prošlost, rezervacije, blokade

## create_reservation

```
create_reservation(p_court_id, p_date_iso, p_start_hhmm, p_duration_minutes, p_racket?) → reservations
```

- **Parametri**: court_id, datum, start (HH:mm), 60|120, racket (default false)
- **Return**: kreirani red iz reservations
- **Validacija**: auth, court postoji i aktivan, datum u okviru 30 dana, start na sat, radno vreme 09–24, nije prošlost
- **Double-booking**: trigger `check_reservation_overlap` sprečava preklapanje

## cancel_reservation

```
cancel_reservation(p_reservation_id uuid) → reservations
```

- **Parametri**: id rezervacije
- **Validacija**: owner, status=booked, min 2h pre početka
- **Error**: not_found, already_cancelled, cancel_too_late

## list_reservations_mine

```
list_reservations_mine() → TABLE(id, user_email, court_name, date_iso, start_time, end_time, status, created_at)
```

- **Return**: rezervacije trenutnog korisnika, status mapiran (booked→Rezervisano, cancelled/no_show→Otkazano)

## list_reservations_admin

```
list_reservations_admin(p_date_iso text, p_search text?) → TABLE(...)
```

- **Validacija**: is_admin()
- **Return**: sve rezervacije za datum, opciono filtrirane po imenu/telefonu

## admin_cancel_reservation, admin_mark_no_show

- **Validacija**: is_admin(), rezervacija postoji, status=booked

## list_blocks_admin, create_block, cancel_block

- **Validacija**: is_admin(); create_block proverava konflikt sa rezervacijama/blokadama

## admin_daily_overview, create_blocks_bulk, cancel_blocks_bulk

- **Validacija**: is_admin()

## check_phone_available

```
check_phone_available(p_phone text) → boolean
```

- **Return**: true ako telefon nije zauzet
- **GRANT**: anon (za registraciju pre login-a)
