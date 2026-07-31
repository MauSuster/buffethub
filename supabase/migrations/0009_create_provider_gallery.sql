-- ============================================================
-- Migration: galeria de imagens dos fornecedores
-- Arquivo: 0009_create_provider_gallery.sql
-- ============================================================

BEGIN;

-- ============================================================
-- TABELA DA GALERIA
-- ============================================================
--
-- A tabela pode ter sido criada parcialmente pela migration 0008.
-- Por isso, além do CREATE TABLE IF NOT EXISTS, as colunas são
-- garantidas individualmente com ADD COLUMN IF NOT EXISTS.

CREATE TABLE IF NOT EXISTS public.provider_gallery_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  provider_id uuid NOT NULL
    REFERENCES public.providers(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,

  storage_path text NOT NULL,

  alt_text text,

  position integer NOT NULL DEFAULT 0,

  created_at timestamptz NOT NULL DEFAULT now(),

  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.provider_gallery_images
ADD COLUMN IF NOT EXISTS provider_id uuid;

ALTER TABLE public.provider_gallery_images
ADD COLUMN IF NOT EXISTS storage_path text;

ALTER TABLE public.provider_gallery_images
ADD COLUMN IF NOT EXISTS alt_text text;

ALTER TABLE public.provider_gallery_images
ADD COLUMN IF NOT EXISTS position integer DEFAULT 0;

ALTER TABLE public.provider_gallery_images
ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

ALTER TABLE public.provider_gallery_images
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- ============================================================
-- NORMALIZAÇÃO DOS DADOS EXISTENTES
-- ============================================================

UPDATE public.provider_gallery_images
SET position = 0
WHERE position IS NULL;

UPDATE public.provider_gallery_images
SET created_at = now()
WHERE created_at IS NULL;

UPDATE public.provider_gallery_images
SET updated_at = now()
WHERE updated_at IS NULL;

-- ============================================================
-- FOREIGN KEY
-- ============================================================

ALTER TABLE public.provider_gallery_images
DROP CONSTRAINT IF EXISTS provider_gallery_images_provider_id_fkey;

ALTER TABLE public.provider_gallery_images
ADD CONSTRAINT provider_gallery_images_provider_id_fkey
FOREIGN KEY (provider_id)
REFERENCES public.providers(id)
ON UPDATE CASCADE
ON DELETE CASCADE;

-- ============================================================
-- NOT NULL
-- ============================================================
--
-- Essas restrições são aplicadas somente depois da normalização
-- dos registros existentes.

ALTER TABLE public.provider_gallery_images
ALTER COLUMN provider_id SET NOT NULL;

ALTER TABLE public.provider_gallery_images
ALTER COLUMN storage_path SET NOT NULL;

ALTER TABLE public.provider_gallery_images
ALTER COLUMN position SET DEFAULT 0;

ALTER TABLE public.provider_gallery_images
ALTER COLUMN position SET NOT NULL;

ALTER TABLE public.provider_gallery_images
ALTER COLUMN created_at SET DEFAULT now();

ALTER TABLE public.provider_gallery_images
ALTER COLUMN created_at SET NOT NULL;

ALTER TABLE public.provider_gallery_images
ALTER COLUMN updated_at SET DEFAULT now();

ALTER TABLE public.provider_gallery_images
ALTER COLUMN updated_at SET NOT NULL;

-- ============================================================
-- CONSTRAINTS
-- ============================================================

ALTER TABLE public.provider_gallery_images
DROP CONSTRAINT IF EXISTS provider_gallery_images_storage_path_not_empty;

ALTER TABLE public.provider_gallery_images
ADD CONSTRAINT provider_gallery_images_storage_path_not_empty
CHECK (length(trim(storage_path)) > 0);

ALTER TABLE public.provider_gallery_images
DROP CONSTRAINT IF EXISTS provider_gallery_images_position_non_negative;

ALTER TABLE public.provider_gallery_images
ADD CONSTRAINT provider_gallery_images_position_non_negative
CHECK (position >= 0);

ALTER TABLE public.provider_gallery_images
DROP CONSTRAINT IF EXISTS provider_gallery_images_storage_path_unique;

ALTER TABLE public.provider_gallery_images
ADD CONSTRAINT provider_gallery_images_storage_path_unique
UNIQUE (storage_path);

-- ============================================================
-- COMENTÁRIOS
-- ============================================================

COMMENT ON TABLE public.provider_gallery_images IS
  'Imagens da galeria pública dos fornecedores.';

COMMENT ON COLUMN public.provider_gallery_images.provider_id IS
  'Fornecedor proprietário da imagem.';

COMMENT ON COLUMN public.provider_gallery_images.storage_path IS
  'Caminho do arquivo dentro do bucket provider-gallery.';

COMMENT ON COLUMN public.provider_gallery_images.alt_text IS
  'Texto alternativo utilizado para acessibilidade.';

COMMENT ON COLUMN public.provider_gallery_images.position IS
  'Posição da imagem na galeria, começando em zero.';

-- ============================================================
-- ÍNDICES
-- ============================================================

CREATE INDEX IF NOT EXISTS
  provider_gallery_images_provider_id_idx
ON public.provider_gallery_images(provider_id);

CREATE INDEX IF NOT EXISTS
  provider_gallery_images_provider_position_idx
ON public.provider_gallery_images(
  provider_id,
  position
);

CREATE INDEX IF NOT EXISTS
  provider_gallery_images_created_at_idx
ON public.provider_gallery_images(created_at);

-- ============================================================
-- UPDATED_AT
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS
  set_provider_gallery_images_updated_at
ON public.provider_gallery_images;

CREATE TRIGGER set_provider_gallery_images_updated_at
BEFORE UPDATE ON public.provider_gallery_images
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.provider_gallery_images
ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS
  "Galeria publica pode ser visualizada"
ON public.provider_gallery_images;

DROP POLICY IF EXISTS
  "Fornecedor pode inserir imagens da propria galeria"
ON public.provider_gallery_images;

DROP POLICY IF EXISTS
  "Fornecedor pode atualizar imagens da propria galeria"
ON public.provider_gallery_images;

DROP POLICY IF EXISTS
  "Fornecedor pode excluir imagens da propria galeria"
ON public.provider_gallery_images;

-- ============================================================
-- POLICIES DA TABELA
-- ============================================================
--
-- No Supabase:
--   - leitura para anon e authenticated;
--   - escrita apenas para o proprietário do fornecedor.
--
-- No PostgreSQL genérico do CI:
--   - leitura para PUBLIC;
--   - policies de escrita não são criadas, pois auth.uid()
--     não está disponível nesse ambiente.

DO $$
DECLARE
  has_anon_role boolean;
  has_authenticated_role boolean;
  has_auth_schema boolean;
  has_auth_uid_function boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_roles
    WHERE rolname = 'anon'
  )
  INTO has_anon_role;

  SELECT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_roles
    WHERE rolname = 'authenticated'
  )
  INTO has_authenticated_role;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.schemata
    WHERE schema_name = 'auth'
  )
  INTO has_auth_schema;

  SELECT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_proc procedure
    JOIN pg_catalog.pg_namespace namespace
      ON namespace.oid = procedure.pronamespace
    WHERE namespace.nspname = 'auth'
      AND procedure.proname = 'uid'
  )
  INTO has_auth_uid_function;

  IF has_anon_role AND has_authenticated_role THEN
    EXECUTE $policy$
      CREATE POLICY
        "Galeria publica pode ser visualizada"
      ON public.provider_gallery_images
      FOR SELECT
      TO anon, authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.providers provider
          WHERE provider.id =
            provider_gallery_images.provider_id
            AND provider.status = 'APPROVED'
            AND provider.deleted_at IS NULL
        )
      )
    $policy$;
  ELSE
    EXECUTE $policy$
      CREATE POLICY
        "Galeria publica pode ser visualizada"
      ON public.provider_gallery_images
      FOR SELECT
      TO PUBLIC
      USING (
        EXISTS (
          SELECT 1
          FROM public.providers provider
          WHERE provider.id =
            provider_gallery_images.provider_id
            AND provider.status = 'APPROVED'
            AND provider.deleted_at IS NULL
        )
      )
    $policy$;
  END IF;

  IF (
    has_authenticated_role
    AND has_auth_schema
    AND has_auth_uid_function
  ) THEN
    EXECUTE $policy$
      CREATE POLICY
        "Fornecedor pode inserir imagens da propria galeria"
      ON public.provider_gallery_images
      FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.providers provider
          WHERE provider.id =
            provider_gallery_images.provider_id
            AND provider.owner_id = auth.uid()
            AND provider.deleted_at IS NULL
        )
      )
    $policy$;

    EXECUTE $policy$
      CREATE POLICY
        "Fornecedor pode atualizar imagens da propria galeria"
      ON public.provider_gallery_images
      FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.providers provider
          WHERE provider.id =
            provider_gallery_images.provider_id
            AND provider.owner_id = auth.uid()
            AND provider.deleted_at IS NULL
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.providers provider
          WHERE provider.id =
            provider_gallery_images.provider_id
            AND provider.owner_id = auth.uid()
            AND provider.deleted_at IS NULL
        )
      )
    $policy$;

    EXECUTE $policy$
      CREATE POLICY
        "Fornecedor pode excluir imagens da propria galeria"
      ON public.provider_gallery_images
      FOR DELETE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.providers provider
          WHERE provider.id =
            provider_gallery_images.provider_id
            AND provider.owner_id = auth.uid()
            AND provider.deleted_at IS NULL
        )
      )
    $policy$;
  END IF;
END;
$$;

-- ============================================================
-- BUCKET DO SUPABASE STORAGE
-- ============================================================
--
-- O schema storage existe no Supabase, mas pode não existir no
-- PostgreSQL temporário usado pelo CI.
--
-- Por isso, toda configuração de Storage é condicional.

DO $$
DECLARE
  has_storage_schema boolean;
  has_buckets_table boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.schemata
    WHERE schema_name = 'storage'
  )
  INTO has_storage_schema;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'storage'
      AND table_name = 'buckets'
  )
  INTO has_buckets_table;

  IF has_storage_schema AND has_buckets_table THEN
    EXECUTE $storage$
      INSERT INTO storage.buckets (
        id,
        name,
        public,
        file_size_limit,
        allowed_mime_types
      )
      VALUES (
        'provider-gallery',
        'provider-gallery',
        true,
        5242880,
        ARRAY[
          'image/jpeg',
          'image/png',
          'image/webp'
        ]::text[]
      )
      ON CONFLICT (id) DO UPDATE
      SET
        name = EXCLUDED.name,
        public = EXCLUDED.public,
        file_size_limit = EXCLUDED.file_size_limit,
        allowed_mime_types = EXCLUDED.allowed_mime_types
    $storage$;
  END IF;
END;
$$;

-- ============================================================
-- POLICIES DO STORAGE
-- ============================================================

DO $$
DECLARE
  has_storage_schema boolean;
  has_storage_objects_table boolean;
  has_foldername_function boolean;
  has_anon_role boolean;
  has_authenticated_role boolean;
  has_auth_uid_function boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.schemata
    WHERE schema_name = 'storage'
  )
  INTO has_storage_schema;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'storage'
      AND table_name = 'objects'
  )
  INTO has_storage_objects_table;

  SELECT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_proc procedure
    JOIN pg_catalog.pg_namespace namespace
      ON namespace.oid = procedure.pronamespace
    WHERE namespace.nspname = 'storage'
      AND procedure.proname = 'foldername'
  )
  INTO has_foldername_function;

  SELECT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_roles
    WHERE rolname = 'anon'
  )
  INTO has_anon_role;

  SELECT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_roles
    WHERE rolname = 'authenticated'
  )
  INTO has_authenticated_role;

  SELECT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_proc procedure
    JOIN pg_catalog.pg_namespace namespace
      ON namespace.oid = procedure.pronamespace
    WHERE namespace.nspname = 'auth'
      AND procedure.proname = 'uid'
  )
  INTO has_auth_uid_function;

  IF has_storage_schema AND has_storage_objects_table THEN
    EXECUTE $policy$
      DROP POLICY IF EXISTS
        "Imagens publicas da galeria podem ser visualizadas"
      ON storage.objects
    $policy$;

    EXECUTE $policy$
      DROP POLICY IF EXISTS
        "Fornecedor pode enviar imagens para propria pasta"
      ON storage.objects
    $policy$;

    EXECUTE $policy$
      DROP POLICY IF EXISTS
        "Fornecedor pode atualizar imagens da propria pasta"
      ON storage.objects
    $policy$;

    EXECUTE $policy$
      DROP POLICY IF EXISTS
        "Fornecedor pode excluir imagens da propria pasta"
      ON storage.objects
    $policy$;

    IF has_anon_role AND has_authenticated_role THEN
      EXECUTE $policy$
        CREATE POLICY
          "Imagens publicas da galeria podem ser visualizadas"
        ON storage.objects
        FOR SELECT
        TO anon, authenticated
        USING (
          bucket_id = 'provider-gallery'
        )
      $policy$;
    ELSE
      EXECUTE $policy$
        CREATE POLICY
          "Imagens publicas da galeria podem ser visualizadas"
        ON storage.objects
        FOR SELECT
        TO PUBLIC
        USING (
          bucket_id = 'provider-gallery'
        )
      $policy$;
    END IF;

    IF (
      has_authenticated_role
      AND has_auth_uid_function
      AND has_foldername_function
    ) THEN
      EXECUTE $policy$
        CREATE POLICY
          "Fornecedor pode enviar imagens para propria pasta"
        ON storage.objects
        FOR INSERT
        TO authenticated
        WITH CHECK (
          bucket_id = 'provider-gallery'
          AND EXISTS (
            SELECT 1
            FROM public.providers provider
            WHERE provider.owner_id = auth.uid()
              AND provider.deleted_at IS NULL
              AND provider.id::text =
                (storage.foldername(name))[1]
          )
        )
      $policy$;

      EXECUTE $policy$
        CREATE POLICY
          "Fornecedor pode atualizar imagens da propria pasta"
        ON storage.objects
        FOR UPDATE
        TO authenticated
        USING (
          bucket_id = 'provider-gallery'
          AND EXISTS (
            SELECT 1
            FROM public.providers provider
            WHERE provider.owner_id = auth.uid()
              AND provider.deleted_at IS NULL
              AND provider.id::text =
                (storage.foldername(name))[1]
          )
        )
        WITH CHECK (
          bucket_id = 'provider-gallery'
          AND EXISTS (
            SELECT 1
            FROM public.providers provider
            WHERE provider.owner_id = auth.uid()
              AND provider.deleted_at IS NULL
              AND provider.id::text =
                (storage.foldername(name))[1]
          )
        )
      $policy$;

      EXECUTE $policy$
        CREATE POLICY
          "Fornecedor pode excluir imagens da propria pasta"
        ON storage.objects
        FOR DELETE
        TO authenticated
        USING (
          bucket_id = 'provider-gallery'
          AND EXISTS (
            SELECT 1
            FROM public.providers provider
            WHERE provider.owner_id = auth.uid()
              AND provider.deleted_at IS NULL
              AND provider.id::text =
                (storage.foldername(name))[1]
          )
        )
      $policy$;
    END IF;
  END IF;
END;
$$;

-- ============================================================
-- RECARREGAMENTO DO POSTGREST
-- ============================================================
--
-- O canal pgrst pode não existir no PostgreSQL genérico, mas
-- NOTIFY não falha caso não haja nenhum listener conectado.

NOTIFY pgrst, 'reload schema';

COMMIT;