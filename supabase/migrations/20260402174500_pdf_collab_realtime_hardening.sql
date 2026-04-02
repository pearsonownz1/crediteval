alter table public.pdf_collab_sessions replica identity full;
alter table public.pdf_collab_annotations replica identity full;
alter table public.pdf_collab_comments replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.pdf_collab_sessions;
exception
  when duplicate_object then null;
  when undefined_object then null;
end
$$;

do $$
begin
  alter publication supabase_realtime add table public.pdf_collab_annotations;
exception
  when duplicate_object then null;
  when undefined_object then null;
end
$$;

do $$
begin
  alter publication supabase_realtime add table public.pdf_collab_comments;
exception
  when duplicate_object then null;
  when undefined_object then null;
end
$$;
