-- Voer dit uit in Supabase → SQL Editor (één keer per project).
-- Daarna: Authentication → Users: maak één gebruiker aan voor de verhuurder (e-mail + wachtwoord).
-- Ook: Authentication → URL Configuration → Site URL = jouw live site (bv. https://www.casa-pheli.be)
--      en voeg hetzelfde domein toe bij Redirect URLs (anders kan inloggen falen).

create table if not exists public.booked_days (
  day date primary key not null
);

alter table public.booked_days enable row level security;

-- Publiek: iedereen mag de kalender lezen
drop policy if exists "booked_days_select_public" on public.booked_days;
create policy "booked_days_select_public"
  on public.booked_days
  for select
  using (true);

-- Alleen ingelogde gebruikers (Auth) mogen dagen toevoegen
drop policy if exists "booked_days_insert_auth" on public.booked_days;
create policy "booked_days_insert_auth"
  on public.booked_days
  for insert
  to authenticated
  with check (true);

-- Alleen ingelogde gebruikers mogen dagen verwijderen (= weer vrij)
drop policy if exists "booked_days_delete_auth" on public.booked_days;
create policy "booked_days_delete_auth"
  on public.booked_days
  for delete
  to authenticated
  using (true);
