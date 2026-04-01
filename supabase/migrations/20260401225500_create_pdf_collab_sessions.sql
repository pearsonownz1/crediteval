insert into storage.buckets (id, name, public)
select 'pdf-collab', 'pdf-collab', true
where not exists (
  select 1 from storage.buckets where id = 'pdf-collab'
);

create table if not exists public.pdf_collab_sessions (
  session_id text primary key,
  session_name text not null,
  storage_path text,
  public_url text,
  original_filename text,
  file_size bigint,
  uploaded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_pdf_collab_sessions_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists pdf_collab_sessions_set_updated_at on public.pdf_collab_sessions;
create trigger pdf_collab_sessions_set_updated_at
before update on public.pdf_collab_sessions
for each row
execute function public.set_pdf_collab_sessions_updated_at();

alter table public.pdf_collab_sessions enable row level security;

create policy "public can read pdf collab sessions"
on public.pdf_collab_sessions
for select
using (true);

create policy "public can insert pdf collab sessions"
on public.pdf_collab_sessions
for insert
with check (true);

create policy "public can update pdf collab sessions"
on public.pdf_collab_sessions
for update
using (true)
with check (true);

create policy "public can delete pdf collab sessions"
on public.pdf_collab_sessions
for delete
using (true);

create policy "public can read pdf collab objects"
on storage.objects
for select
using (bucket_id = 'pdf-collab');

create policy "public can insert pdf collab objects"
on storage.objects
for insert
with check (bucket_id = 'pdf-collab');

create policy "public can update pdf collab objects"
on storage.objects
for update
using (bucket_id = 'pdf-collab')
with check (bucket_id = 'pdf-collab');

create policy "public can delete pdf collab objects"
on storage.objects
for delete
using (bucket_id = 'pdf-collab');
