-- Private bucket for fund documents (legal, term sheets, compliance).
-- Path pattern: fund/{fund_id}/{filename}
insert into storage.buckets (id, name, public)
values ('fund-documents', 'fund-documents', false)
on conflict (id) do nothing;

-- Allow authenticated users to upload only under their fund path (app enforces fund access).
create policy "fund_documents_upload"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'fund-documents'
  and (storage.foldername(name))[1] = 'fund'
);

-- Allow authenticated users to read objects (signed URLs or direct read); RLS on public.documents controls which paths are visible.
create policy "fund_documents_select"
on storage.objects for select
to authenticated
using (bucket_id = 'fund-documents');

-- Allow delete/update for same bucket (app will restrict by fund).
create policy "fund_documents_update"
on storage.objects for update
to authenticated
using (bucket_id = 'fund-documents')
with check (bucket_id = 'fund-documents');

create policy "fund_documents_delete"
on storage.objects for delete
to authenticated
using (bucket_id = 'fund-documents');
