begin;

-- Extend activity_changes.type check constraint to allow 'deletion'
alter table public.activity_changes drop constraint if exists activity_changes_type_check;
alter table public.activity_changes add constraint activity_changes_type_check
  check (type in ('addition', 'feedback', 'update', 'deletion'));

commit;

/* Down (manual notes)
- alter table public.activity_changes drop constraint if exists activity_changes_type_check;
- alter table public.activity_changes add constraint activity_changes_type_check check (type in ('addition','feedback','update'));
*/


