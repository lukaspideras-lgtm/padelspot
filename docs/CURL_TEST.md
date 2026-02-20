# PadelSpot – curl test (dokaz da backend radi)

Zameni `SUPABASE_URL` i `ANON_KEY` sa stvarnim vrednostima iz `.env`.

## 1) Supabase connectivity (health)

```bash
curl -s -o /dev/null -w "%{http_code}" \
  "https://SUPABASE_URL/rest/v1/" \
  -H "apikey: ANON_KEY" -H "Authorization: Bearer ANON_KEY"
```

**Očekivano:** `200` (ili `406` ako fali Accept header – oba znače da Supabase odgovara)

---

## 2) Login (password) – dobij access_token

```bash
curl -s -X POST "https://SUPABASE_URL/auth/v1/token?grant_type=password" \
  -H "apikey: ANON_KEY" -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123456"}'
```

**Očekivano:** JSON sa `access_token` i `refresh_token`.  
Ako korisnik ne postoji: `{"error":"invalid_grant","error_description":"Invalid login credentials"}`.  
Za novog korisnika: prvo koristi registraciju (signup) ili kreiraj u Supabase Dashboard.

**Alternativa – registracija (password):**
```bash
curl -s -X POST "https://SUPABASE_URL/auth/v1/signup" \
  -H "apikey: ANON_KEY" -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123456","data":{"first_name":"Test","last_name":"User","phone":"0612345678"}}'
```

**Očekivano:** `{"access_token":"...","user":{...}}`

---

## 3) List courts (mora vratiti bar 1)

```bash
curl -s "https://SUPABASE_URL/rest/v1/courts?select=id,name,accent&is_active=eq.true" \
  -H "apikey: ANON_KEY" -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Accept: application/json"
```

**Očekivano:** `[{"id":"uuid-...","name":"Zeleni teren","accent":"green"},...]`  
Sačuvaj `id` prvog terena za sledeće korake.

---

## 4) getAvailability (ne sme 401/prazno)

```bash
curl -s -X POST "https://SUPABASE_URL/rest/v1/rpc/list_availability" \
  -H "apikey: ANON_KEY" -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" -H "Accept: application/json" \
  -d '{"date_iso":"2025-02-20","court_id":"COURT_UUID","duration_minutes":60}'
```

**Očekivano:** `["09:00","10:00","11:00",...]` – niz stringova

---

## 5) create_reservation (vrati id)

```bash
curl -s -X POST "https://SUPABASE_URL/rest/v1/rpc/create_reservation" \
  -H "apikey: ANON_KEY" -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" -H "Accept: application/json" \
  -d '{"p_court_id":"COURT_UUID","p_date_iso":"2025-02-20","p_start_hhmm":"18:00","p_duration_minutes":60,"p_racket":false}'
```

**Očekivano:** `{"id":"uuid-...","user_id":"...","court_id":"...","start_time":"...","status":"booked",...}`

---

## 6) listMine (mora videti tu rezervaciju)

```bash
curl -s -X POST "https://SUPABASE_URL/rest/v1/rpc/list_reservations_mine" \
  -H "apikey: ANON_KEY" -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" -H "Accept: application/json"
```

**Očekivano:** `[{"id":"uuid-...","court_name":"Zeleni teren","date_iso":"2025-02-20","start_time":"18:00","end_time":"19:00","status":"Rezervisano",...}]`

---

## Jedan skript (bash/zsh)

```bash
#!/bin/bash
URL="https://SUPABASE_URL"
KEY="ANON_KEY"

# 1) Connectivity
echo "1) Connectivity:"
curl -s -o /dev/null -w "%{http_code}\n" "$URL/rest/v1/" -H "apikey: $KEY" -H "Authorization: Bearer $KEY"

# 2) Login
echo "2) Login:"
TOKEN=$(curl -s -X POST "$URL/auth/v1/token?grant_type=password" \
  -H "apikey: $KEY" -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123456"}' | jq -r '.access_token')
echo "Token: ${TOKEN:0:20}..."

# 3) Courts
echo "3) Courts:"
COURT_ID=$(curl -s "$URL/rest/v1/courts?select=id&is_active=eq.true&limit=1" \
  -H "apikey: $KEY" -H "Authorization: Bearer $TOKEN" -H "Accept: application/json" | jq -r '.[0].id')
echo "Court ID: $COURT_ID"

# 4) Availability
echo "4) Availability:"
curl -s -X POST "$URL/rest/v1/rpc/list_availability" \
  -H "apikey: $KEY" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"date_iso\":\"2025-02-20\",\"court_id\":\"$COURT_ID\",\"duration_minutes\":60}" | jq -c .

# 5) Create reservation
echo "5) Create reservation:"
curl -s -X POST "$URL/rest/v1/rpc/create_reservation" \
  -H "apikey: $KEY" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"p_court_id\":\"$COURT_ID\",\"p_date_iso\":\"2025-02-20\",\"p_start_hhmm\":\"18:00\",\"p_duration_minutes\":60,\"p_racket\":false}" | jq -c .

# 6) List mine
echo "6) List mine:"
curl -s -X POST "$URL/rest/v1/rpc/list_reservations_mine" \
  -H "apikey: $KEY" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" | jq -c .
```
