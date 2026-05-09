-- ============================================================
-- 0005_storage_buckets.sql
-- ============================================================
-- Storage buckets and their RLS policies. Outpost stores all binary
-- assets in `tenant-files` and namespaces by tenant_id, then user_id,
-- then module/record. Existing SSE photos in the legacy
-- `inspection-photos` bucket can be left in place (URL references stay
-- valid) or migrated by a one-shot script during the data migration.

insert into storage.buckets (id, name, public)
values ('tenant-files', 'tenant-files', true)
on conflict (id) do nothing;

-- The first folder segment is tenant_id (uuid). The second segment is
-- user_id (auth.uid()). RLS verifies the caller is an active member of
-- the tenant before allowing writes/deletes/updates. Reads are allowed
-- via the public CDN endpoint when the bucket is public; toggle this off
-- if any tenant requires private files.
create policy "tenant-files: members upload to own tenant folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'tenant-files'
    and (storage.foldername(name))[1] is not null
    and exists (
      select 1 from public.tenant_memberships m
      where m.user_id = auth.uid()
        and m.tenant_id = ((storage.foldername(name))[1])::uuid
        and m.status = 'active'
    )
  );

create policy "tenant-files: members delete from own tenant folder"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'tenant-files'
    and (storage.foldername(name))[1] is not null
    and exists (
      select 1 from public.tenant_memberships m
      where m.user_id = auth.uid()
        and m.tenant_id = ((storage.foldername(name))[1])::uuid
        and m.status = 'active'
    )
  );

create policy "tenant-files: members update in own tenant folder"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'tenant-files'
    and (storage.foldername(name))[1] is not null
    and exists (
      select 1 from public.tenant_memberships m
      where m.user_id = auth.uid()
        and m.tenant_id = ((storage.foldername(name))[1])::uuid
        and m.status = 'active'
    )
  );
