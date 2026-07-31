-- =============================================================================
-- 0008 — Galeria de imagens dos fornecedores
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.provider_gallery_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.providers (id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  position integer NOT NULL DEFAULT 0 CHECK (position >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT provider_gallery_images_path_not_blank CHECK (length(trim(storage_path)) > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS provider_gallery_images_storage_path_key
  ON public.provider_gallery_images (storage_path);

CREATE UNIQUE INDEX IF NOT EXISTS provider_gallery_images_provider_position_key
  ON public.provider_gallery_images (provider_id, position);

CREATE INDEX IF NOT EXISTS provider_gallery_images_provider_idx
  ON public.provider_gallery_images (provider_id);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS provider_gallery_images_set_updated_at
ON public.provider_gallery_images;

CREATE TRIGGER provider_gallery_images_set_updated_at
BEFORE UPDATE ON public.provider_gallery_images
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.provider_gallery_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY provider_gallery_images_select ON public.provider_gallery_images
  FOR SELECT USING (
    public.provider_is_public(provider_id)
    OR public.is_provider_member(provider_id)
    OR public.is_staff()
  );

CREATE POLICY provider_gallery_images_insert ON public.provider_gallery_images
  FOR INSERT WITH CHECK (
    public.can_manage_provider(provider_id)
  );

CREATE POLICY provider_gallery_images_update ON public.provider_gallery_images
  FOR UPDATE USING (
    public.can_manage_provider(provider_id)
  ) WITH CHECK (
    public.can_manage_provider(provider_id)
  );

CREATE POLICY provider_gallery_images_delete ON public.provider_gallery_images
  FOR DELETE USING (
    public.can_manage_provider(provider_id)
  );

COMMIT;
