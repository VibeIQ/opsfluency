-- sop_images: per-SOP manager-uploaded images (procedure diagrams, photos, charts).
-- Images live in the public `sop-images` bucket so workers load them directly
-- from the CDN URL with no signed-URL round-trip.
-- company_id is duplicated from sops so RLS can scope reads without a join.
-- The FK to sops cascades deletes so cleaning up an SOP also removes its images.

CREATE TABLE IF NOT EXISTS sop_images (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  sop_id       UUID        NOT NULL REFERENCES sops(id) ON DELETE CASCADE,
  company_id   UUID        NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  storage_path TEXT        NOT NULL,
  caption_en   TEXT,
  caption_es   TEXT,
  sort_order   INTEGER     NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE sop_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY sop_images_company_isolation ON sop_images
  FOR ALL TO authenticated
  USING      (company_id = requesting_company_id() OR is_super_admin())
  WITH CHECK (company_id = requesting_company_id() OR is_super_admin());

-- Public bucket: workers load images directly via CDN URL (no auth header).
-- File-size and MIME limits enforced here and again in the upload server action.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'sop-images',
  'sop-images',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage object RLS. The admin client in server actions bypasses these, but
-- they guard against a misconfigured direct-client hitting the storage API.
CREATE POLICY "sop_images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'sop-images');

CREATE POLICY "sop_images_auth_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'sop-images');

CREATE POLICY "sop_images_auth_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'sop-images');
