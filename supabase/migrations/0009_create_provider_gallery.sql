begin;

-- ============================================================
-- GALERIA DE IMAGENS DOS FORNECEDORES
-- ============================================================

create table if not exists public.provider_gallery_images (
  id uuid primary key default gen_random_uuid(),

  provider_id uuid not null
    references public.providers(id)
    on update cascade
    on delete cascade,

  storage_path text not null,

  alt_text text,

  position integer not null default 0,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now(),

  constraint provider_gallery_images_storage_path_not_empty
    check (length(trim(storage_path)) > 0),

  constraint provider_gallery_images_position_non_negative
    check (position >= 0),

  constraint provider_gallery_images_storage_path_unique
    unique (storage_path)
);

comment on table public.provider_gallery_images is
  'Imagens da galeria pública dos fornecedores.';

comment on column public.provider_gallery_images.storage_path is
  'Caminho do arquivo dentro do bucket provider-gallery.';

comment on column public.provider_gallery_images.position is
  'Posição da imagem na galeria, começando em zero.';

-- ============================================================
-- ÍNDICES
-- ============================================================

create index if not exists provider_gallery_images_provider_id_idx
  on public.provider_gallery_images(provider_id);

create index if not exists provider_gallery_images_provider_position_idx
  on public.provider_gallery_images(provider_id, position);

create index if not exists provider_gallery_images_created_at_idx
  on public.provider_gallery_images(created_at);

-- ============================================================
-- UPDATED_AT
-- ============================================================

-- Usa a função padrão do projeto, caso ela já exista.
-- Se não existir, cria uma função segura e reutilizável.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_provider_gallery_images_updated_at
  on public.provider_gallery_images;

create trigger set_provider_gallery_images_updated_at
before update on public.provider_gallery_images
for each row
execute function public.set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.provider_gallery_images
  enable row level security;

-- Remove policies anteriores para permitir reaplicar a migration
-- durante o desenvolvimento sem conflito de nomes.

drop policy if exists
  "Galeria publica pode ser visualizada"
  on public.provider_gallery_images;

drop policy if exists
  "Fornecedor pode inserir imagens da propria galeria"
  on public.provider_gallery_images;

drop policy if exists
  "Fornecedor pode atualizar imagens da propria galeria"
  on public.provider_gallery_images;

drop policy if exists
  "Fornecedor pode excluir imagens da propria galeria"
  on public.provider_gallery_images;

-- Leitura pública.

create policy "Galeria publica pode ser visualizada"
on public.provider_gallery_images
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.providers
    where providers.id = provider_gallery_images.provider_id
      and providers.status = 'APPROVED'
      and providers.deleted_at is null
  )
);

-- O schema compartilhado anteriormente mostra que providers usa owner_id.

create policy "Fornecedor pode inserir imagens da propria galeria"
on public.provider_gallery_images
for insert
to authenticated
with check (
  exists (
    select 1
    from public.providers
    where providers.id = provider_gallery_images.provider_id
      and providers.owner_id = auth.uid()
      and providers.deleted_at is null
  )
);

create policy "Fornecedor pode atualizar imagens da propria galeria"
on public.provider_gallery_images
for update
to authenticated
using (
  exists (
    select 1
    from public.providers
    where providers.id = provider_gallery_images.provider_id
      and providers.owner_id = auth.uid()
      and providers.deleted_at is null
  )
)
with check (
  exists (
    select 1
    from public.providers
    where providers.id = provider_gallery_images.provider_id
      and providers.owner_id = auth.uid()
      and providers.deleted_at is null
  )
);

create policy "Fornecedor pode excluir imagens da propria galeria"
on public.provider_gallery_images
for delete
to authenticated
using (
  exists (
    select 1
    from public.providers
    where providers.id = provider_gallery_images.provider_id
      and providers.owner_id = auth.uid()
      and providers.deleted_at is null
  )
);

-- ============================================================
-- BUCKET DO SUPABASE STORAGE
-- ============================================================

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'provider-gallery',
  'provider-gallery',
  true,
  5242880,
  array[
    'image/jpeg',
    'image/png',
    'image/webp'
  ]::text[]
)
on conflict (id) do update
set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ============================================================
-- POLICIES DO STORAGE
-- ============================================================

drop policy if exists
  "Imagens publicas da galeria podem ser visualizadas"
  on storage.objects;

drop policy if exists
  "Fornecedor pode enviar imagens para propria pasta"
  on storage.objects;

drop policy if exists
  "Fornecedor pode atualizar imagens da propria pasta"
  on storage.objects;

drop policy if exists
  "Fornecedor pode excluir imagens da propria pasta"
  on storage.objects;

-- Mesmo em bucket público, esta policy permite leitura pela API.

create policy "Imagens publicas da galeria podem ser visualizadas"
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'provider-gallery'
);

-- O primeiro diretório do storage_path deve ser o provider_id:
--
-- provider-id/uuid.webp

create policy "Fornecedor pode enviar imagens para propria pasta"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'provider-gallery'
  and exists (
    select 1
    from public.providers
    where providers.owner_id = auth.uid()
      and providers.deleted_at is null
      and providers.id::text = (storage.foldername(name))[1]
  )
);

create policy "Fornecedor pode atualizar imagens da propria pasta"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'provider-gallery'
  and exists (
    select 1
    from public.providers
    where providers.owner_id = auth.uid()
      and providers.deleted_at is null
      and providers.id::text = (storage.foldername(name))[1]
  )
)
with check (
  bucket_id = 'provider-gallery'
  and exists (
    select 1
    from public.providers
    where providers.owner_id = auth.uid()
      and providers.deleted_at is null
      and providers.id::text = (storage.foldername(name))[1]
  )
);

create policy "Fornecedor pode excluir imagens da propria pasta"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'provider-gallery'
  and exists (
    select 1
    from public.providers
    where providers.owner_id = auth.uid()
      and providers.deleted_at is null
      and providers.id::text = (storage.foldername(name))[1]
  )
);

-- Solicita ao PostgREST que recarregue o schema após a migration.

notify pgrst, 'reload schema';

commit;