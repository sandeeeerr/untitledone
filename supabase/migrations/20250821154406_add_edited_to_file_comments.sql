-- Kolom toevoegen
alter table public.file_comments
  add column if not exists edited boolean not null default false;

create or replace function public.mark_comment_edited()
returns trigger
language plpgsql
as $$
begin
  if new.comment is distinct from old.comment then
    new.edited := true;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_file_comments_mark_edited on public.file_comments;
create trigger trg_file_comments_mark_edited
before update on public.file_comments
for each row execute function public.mark_comment_edited();

-- Gebruikers mogen hun eigen comment bijwerken, mits toegang tot het project
create policy "Users can update their own comments"
on public.file_comments
as permissive
for update
to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1
    from public.project_files pf
    join public.projects p on p.id = pf.project_id
    where pf.id = file_comments.file_id
      and (not p.is_private or p.owner_id = auth.uid())
  )
)
with check (user_id = auth.uid());