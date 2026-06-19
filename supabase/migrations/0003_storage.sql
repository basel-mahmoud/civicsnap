-- Storage bucket for report photos.
-- Public read (photos appear on the public map); authenticated users may
-- upload only into their own user-id folder; images only, size capped.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'report-photos',
  'report-photos',
  true,
  5242880, -- 5 MB
  array['image/jpeg','image/png','image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Anyone can view photos.
drop policy if exists report_photos_read on storage.objects;
create policy report_photos_read on storage.objects
  for select using (bucket_id = 'report-photos');

-- Authenticated users upload into a folder named after their own uid,
-- e.g. report-photos/<auth.uid()>/<filename>.
drop policy if exists report_photos_insert on storage.objects;
create policy report_photos_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'report-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users may delete their own uploads.
drop policy if exists report_photos_delete on storage.objects;
create policy report_photos_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'report-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
