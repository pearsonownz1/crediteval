create table if not exists public.pdf_collab_participants (
  instance_id text primary key,
  session_id text not null,
  profile_id text not null,
  name text not null,
  active_tool text not null default 'pointer',
  is_in_call boolean not null default false,
  cursor_x_percent numeric(6, 3),
  cursor_y_percent numeric(6, 3),
  joined_at timestamptz not null default now(),
  last_heartbeat_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pdf_collab_participants_active_tool_check
    check (active_tool in ('pointer', 'pin')),
  constraint pdf_collab_participants_cursor_pair_check
    check (
      (cursor_x_percent is null and cursor_y_percent is null)
      or (
        cursor_x_percent is not null
        and cursor_y_percent is not null
        and cursor_x_percent >= 0
        and cursor_x_percent <= 100
        and cursor_y_percent >= 0
        and cursor_y_percent <= 100
      )
    )
);

create index if not exists pdf_collab_participants_session_heartbeat_idx
on public.pdf_collab_participants (session_id, last_heartbeat_at desc, joined_at asc);

create or replace function public.set_pdf_collab_participants_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists pdf_collab_participants_set_updated_at on public.pdf_collab_participants;
create trigger pdf_collab_participants_set_updated_at
before update on public.pdf_collab_participants
for each row
execute function public.set_pdf_collab_participants_updated_at();

alter table public.pdf_collab_participants enable row level security;

create policy "public can read pdf collab participants"
on public.pdf_collab_participants
for select
using (true);

create policy "public can insert pdf collab participants"
on public.pdf_collab_participants
for insert
with check (true);

create policy "public can update pdf collab participants"
on public.pdf_collab_participants
for update
using (true)
with check (true);

create policy "public can delete pdf collab participants"
on public.pdf_collab_participants
for delete
using (true);
