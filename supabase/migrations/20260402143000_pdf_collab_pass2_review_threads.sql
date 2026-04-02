alter table public.pdf_collab_annotations
  add column if not exists title text,
  add column if not exists annotation_type text not null default 'comment',
  add column if not exists status text not null default 'open',
  add column if not exists priority text not null default 'normal',
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists resolved_at timestamptz;

update public.pdf_collab_annotations
set
  annotation_type = coalesce(nullif(annotation_type, ''), 'comment'),
  status = coalesce(nullif(status, ''), 'open'),
  priority = coalesce(nullif(priority, ''), 'normal'),
  updated_at = coalesce(updated_at, created_at, now())
where true;

alter table public.pdf_collab_annotations
  add constraint pdf_collab_annotations_annotation_type_check
    check (annotation_type in ('comment', 'question', 'issue', 'approval')),
  add constraint pdf_collab_annotations_status_check
    check (status in ('open', 'in_review', 'resolved')),
  add constraint pdf_collab_annotations_priority_check
    check (priority in ('low', 'normal', 'high', 'urgent'));

create or replace function public.set_pdf_collab_annotations_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  if new.status = 'resolved' and old.status is distinct from 'resolved' then
    new.resolved_at = now();
  elsif new.status <> 'resolved' then
    new.resolved_at = null;
  end if;
  return new;
end;
$$;

drop trigger if exists pdf_collab_annotations_set_updated_at on public.pdf_collab_annotations;
create trigger pdf_collab_annotations_set_updated_at
before update on public.pdf_collab_annotations
for each row
execute function public.set_pdf_collab_annotations_updated_at();

create table if not exists public.pdf_collab_comments (
  id uuid primary key default gen_random_uuid(),
  session_id text not null references public.pdf_collab_sessions(session_id) on delete cascade,
  annotation_id uuid references public.pdf_collab_annotations(id) on delete cascade,
  parent_id uuid references public.pdf_collab_comments(id) on delete cascade,
  author_id text not null,
  author_name text not null,
  color text not null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_pdf_collab_comments_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists pdf_collab_comments_set_updated_at on public.pdf_collab_comments;
create trigger pdf_collab_comments_set_updated_at
before update on public.pdf_collab_comments
for each row
execute function public.set_pdf_collab_comments_updated_at();

alter table public.pdf_collab_comments enable row level security;

create policy "public can read pdf collab comments"
on public.pdf_collab_comments
for select
using (true);

create policy "public can insert pdf collab comments"
on public.pdf_collab_comments
for insert
with check (true);

create policy "public can update pdf collab comments"
on public.pdf_collab_comments
for update
using (true)
with check (true);

create policy "public can delete pdf collab comments"
on public.pdf_collab_comments
for delete
using (true);

do $$
begin
  alter publication supabase_realtime add table public.pdf_collab_comments;
exception
  when duplicate_object then null;
  when undefined_object then null;
end
$$;
