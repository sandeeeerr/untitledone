begin;

-- Create avatars bucket if not exists and set it to public for easy serving
do $$
begin
  if not exists (select 1 from storage.buckets where id = 'avatars') then
    insert into storage.buckets (id, name, public)
    values ('avatars', 'avatars', true);
  end if;
end $$;

-- RLS policies on storage.objects for the avatars bucket
-- Public read for avatars
drop policy if exists "avatars are public readable" on storage.objects;
create policy "avatars are public readable"
on storage.objects
for select
to authenticated, anon
using (bucket_id = 'avatars');

-- Allow authenticated users to upload into a folder named by their uid
drop policy if exists "users can upload their own avatar" on storage.objects;
create policy "users can upload their own avatar"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and split_part(name, '/', 1) = (select auth.uid()::text)
);

-- Allow users to update files inside their own uid folder
drop policy if exists "users can update their own avatar" on storage.objects;
create policy "users can update their own avatar"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and split_part(name, '/', 1) = (select auth.uid()::text)
)
with check (
  bucket_id = 'avatars'
  and split_part(name, '/', 1) = (select auth.uid()::text)
);

-- Allow users to delete files inside their own uid folder
drop policy if exists "users can delete their own avatar" on storage.objects;
create policy "users can delete their own avatar"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and split_part(name, '/', 1) = (select auth.uid()::text)
);

commit;

/* Down (manual notes)
- delete policies named:
  - avatars are public readable
  - users can upload their own avatar
  - users can update their own avatar
  - users can delete their own avatar
- delete from storage.buckets where id = 'avatars';
*/


