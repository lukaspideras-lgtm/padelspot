# PadelSpot – Schema Reference

## Tabele

### profiles

| Kolona          | Tip        | Opis                          |
|-----------------|------------|-------------------------------|
| id              | uuid PK    | REFERENCES auth.users(id)     |
| first_name      | text       | NOT NULL DEFAULT ''           |
| last_name       | text       | NOT NULL DEFAULT ''           |
| phone           | text       | NOT NULL DEFAULT ''           |
| phone_normalized| text       | za unique check               |
| role            | text       | 'user' \| 'admin'             |
| no_show_count   | int        | NOT NULL DEFAULT 0            |
| created_at      | timestamptz| DEFAULT now()                 |

### courts

| Kolona     | Tip        | Opis                |
|------------|------------|---------------------|
| id         | uuid PK    | gen_random_uuid()   |
| name       | text       | UNIQUE NOT NULL     |
| accent     | text       | NOT NULL (green/blue/orange) |
| is_active  | boolean    | DEFAULT true        |
| created_at | timestamptz| DEFAULT now()       |

### reservations

| Kolona           | Tip        | Opis                          |
|------------------|------------|-------------------------------|
| id               | uuid PK    | gen_random_uuid()             |
| user_id          | uuid       | REFERENCES auth.users        |
| court_id         | uuid       | REFERENCES courts             |
| start_time       | timestamptz| NOT NULL                      |
| end_time         | timestamptz| NOT NULL                      |
| duration_minutes | int        | 60 \| 120                     |
| status           | text       | 'booked' \| 'cancelled' \| 'no_show' |
| racket           | boolean    | DEFAULT false                 |
| price_din        | int        | DEFAULT 0                     |
| created_at       | timestamptz| DEFAULT now()                 |

### blocks

| Kolona           | Tip        | Opis                          |
|------------------|------------|-------------------------------|
| id               | uuid PK    | gen_random_uuid()             |
| court_id         | uuid       | REFERENCES courts             |
| created_by       | uuid       | REFERENCES auth.users         |
| start_time       | timestamptz| NOT NULL                      |
| end_time         | timestamptz| NOT NULL                      |
| duration_minutes | int        | 60 \| 120                     |
| reason           | text       | NOT NULL                      |
| status           | text       | 'active' \| 'cancelled'        |
| created_at       | timestamptz| DEFAULT now()                 |

---

## RPC nazivi (tačan spisak)

| RPC                      | Parametri                                      | Return        |
|--------------------------|------------------------------------------------|---------------|
| list_availability        | date_iso, court_id, duration_minutes           | text[]        |
| create_reservation       | p_court_id, p_date_iso, p_start_hhmm, p_duration_minutes, p_racket? | reservations  |
| cancel_reservation       | p_reservation_id                               | reservations  |
| list_reservations_mine   | –                                              | TABLE         |
| list_reservations_admin  | p_date_iso, p_search?                          | TABLE         |
| admin_cancel_reservation | p_reservation_id                               | reservations  |
| admin_mark_no_show       | p_reservation_id                               | reservations  |
| list_blocks_admin       | p_date_iso                                     | TABLE         |
| create_block             | p_court_id, p_date_iso, p_start_hhmm, p_duration_minutes, p_reason | blocks        |
| cancel_block             | p_block_id                                     | blocks        |
| admin_daily_overview     | p_date_iso                                     | TABLE         |
| create_blocks_bulk       | p_court_id, p_date_iso, p_start_times, p_duration_minutes, p_reason | jsonb         |
| cancel_blocks_bulk      | p_block_ids                                    | int           |
| check_phone_available   | p_phone                                        | boolean       |
| is_admin                 | –                                              | boolean       |
