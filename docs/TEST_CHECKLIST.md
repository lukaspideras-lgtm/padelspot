# PadelSpot – Test Checklist (Supabase Backend)

## 1. User A books 1h, User B cannot overlap

- [ ] User A: reserve Zeleni teren, today, 10:00–11:00, 1h.
- [ ] User B (different account): try same court, same date, 10:00–11:00 → should fail or 10:00 not available.
- [ ] User B: try 11:00–12:00 → should succeed.

## 2. 2h booking blocks two hours

- [ ] User A: reserve Plavi teren, today, 14:00–16:00, 2h.
- [ ] Same or other user: 14:00, 15:00, 14:30–15:30, etc. should all be unavailable for Plavi teren that date.
- [ ] 13:00–14:00 and 16:00–17:00 should remain available.

## 3. Past times today disabled

- [ ] Select today, any court.
- [ ] Slots in the past should show as “Prošlo” or be disabled.
- [ ] Only future slots should be selectable.

## 4. Cancel works only ≥2h before

- [ ] Create a reservation >2h in the future.
- [ ] Istorija screen: “Otkaži” button should work.
- [ ] Create (or have) a reservation &lt;2h away.
- [ ] “Otkaži” should be disabled with message: “Termin se ne može otkazati manje od 2h pre početka.”

## 5. Admin sees all

- [ ] Log in as admin.
- [ ] Open Admin panel.
- [ ] Select date with reservations from multiple users.
- [ ] Grid and list should show all reservations with court + user email.

## 6. Booking window (today..+30 days)

- [ ] Reserve screen: can select dates from today up to +30 days.
- [ ] Date picker should not allow dates beyond +30 days.
- [ ] Trying to book >30 days ahead should show: “Rezervacije su dostupne do 30 dana unapred.”

## 7. Display 00:00 instead of 24:00

- [ ] Reservation ending at midnight (e.g. 23:00–00:00) should show end time as “00:00”, not “24:00”.
