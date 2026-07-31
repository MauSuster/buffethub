-- =============================================================================
-- 0004 — Catálogo: categorias, serviços, cardápios e pacotes
-- =============================================================================

create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  description text,
  icon        text,
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index categories_active_idx on public.categories (is_active, sort_order);

create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

create table public.subcategories (
  id          uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id) on delete cascade,
  slug        text not null,
  name        text not null,
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (category_id, slug)
);

create index subcategories_category_idx on public.subcategories (category_id);

create trigger subcategories_set_updated_at
  before update on public.subcategories
  for each row execute function public.set_updated_at();

-- Join fornecedor <-> categoria (definido aqui pois depende de categories)
create table public.provider_categories (
  provider_id uuid not null references public.providers (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  is_primary  boolean not null default false,
  created_at  timestamptz not null default now(),
  primary key (provider_id, category_id)
);

create index provider_categories_category_idx on public.provider_categories (category_id);

-- -----------------------------------------------------------------------------
-- services
-- -----------------------------------------------------------------------------
create table public.services (
  id                uuid primary key default gen_random_uuid(),
  provider_id       uuid not null references public.providers (id) on delete cascade,
  category_id       uuid not null references public.categories (id) on delete restrict,
  name              text not null,
  slug              text not null,
  short_description text check (char_length(short_description) <= 200),
  description       text,
  price_type        public.price_type not null default 'STARTING_AT',
  base_price_cents  bigint check (base_price_cents >= 0),
  min_quantity      integer check (min_quantity >= 0),
  max_quantity      integer check (max_quantity >= 0),
  duration_minutes  integer check (duration_minutes >= 0),
  min_advance_hours integer not null default 0 check (min_advance_hours >= 0),
  status            public.service_status not null default 'DRAFT',
  is_featured       boolean not null default false,
  sort_order        integer not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz,
  constraint services_quantity_order check (
    min_quantity is null or max_quantity is null or min_quantity <= max_quantity
  ),
  constraint services_price_required check (
    price_type = 'CUSTOM_QUOTE' or base_price_cents is not null
  )
);

comment on constraint services_price_required on public.services is
  'Serviços com preço só podem ficar sem valor quando forem CUSTOM_QUOTE.';

create unique index services_provider_slug_key
  on public.services (provider_id, slug) where deleted_at is null;
create index services_category_idx on public.services (category_id);
create index services_status_idx on public.services (status);
create index services_featured_idx on public.services (is_featured) where is_featured;

create trigger services_set_updated_at
  before update on public.services
  for each row execute function public.set_updated_at();

create table public.service_media (
  id         uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services (id) on delete cascade,
  url        text not null,
  type       text not null check (type in ('IMAGE', 'VIDEO')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index service_media_service_idx on public.service_media (service_id);

create table public.service_items (
  id                uuid primary key default gen_random_uuid(),
  service_id        uuid not null references public.services (id) on delete cascade,
  name              text not null,
  is_included       boolean not null default true,
  is_optional       boolean not null default false,
  extra_price_cents bigint not null default 0 check (extra_price_cents >= 0),
  sort_order        integer not null default 0
);

create index service_items_service_idx on public.service_items (service_id);

-- -----------------------------------------------------------------------------
-- menus
-- -----------------------------------------------------------------------------
create table public.menus (
  id          uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers (id) on delete cascade,
  name        text not null,
  description text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create index menus_provider_idx on public.menus (provider_id);

create trigger menus_set_updated_at
  before update on public.menus
  for each row execute function public.set_updated_at();

create table public.menu_sections (
  id         uuid primary key default gen_random_uuid(),
  menu_id    uuid not null references public.menus (id) on delete cascade,
  name       text not null,
  sort_order integer not null default 0
);

create index menu_sections_menu_idx on public.menu_sections (menu_id);

create table public.menu_items (
  id                uuid primary key default gen_random_uuid(),
  section_id        uuid not null references public.menu_sections (id) on delete cascade,
  name              text not null,
  description       text,
  dietary           public.dietary_option[] not null default '{}',
  extra_price_cents bigint not null default 0 check (extra_price_cents >= 0),
  sort_order        integer not null default 0
);

create index menu_items_section_idx on public.menu_items (section_id);

-- -----------------------------------------------------------------------------
-- packages
-- -----------------------------------------------------------------------------
create table public.packages (
  id                     uuid primary key default gen_random_uuid(),
  provider_id            uuid not null references public.providers (id) on delete cascade,
  name                   text not null,
  slug                   text not null,
  description            text,
  price_cents            bigint check (price_cents >= 0),
  price_per_person_cents bigint check (price_per_person_cents >= 0),
  min_guests             integer check (min_guests >= 0),
  max_guests             integer check (max_guests >= 0),
  duration_minutes       integer check (duration_minutes >= 0),
  menu_id                uuid references public.menus (id) on delete set null,
  includes_staff         boolean not null default false,
  change_policy          text,
  cancellation_policy    text,
  status                 public.service_status not null default 'DRAFT',
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  deleted_at             timestamptz,
  constraint packages_guests_order check (
    min_guests is null or max_guests is null or min_guests <= max_guests
  ),
  constraint packages_price_required check (
    price_cents is not null or price_per_person_cents is not null
  )
);

create unique index packages_provider_slug_key
  on public.packages (provider_id, slug) where deleted_at is null;
create index packages_status_idx on public.packages (status);

create trigger packages_set_updated_at
  before update on public.packages
  for each row execute function public.set_updated_at();

create table public.package_items (
  id          uuid primary key default gen_random_uuid(),
  package_id  uuid not null references public.packages (id) on delete cascade,
  service_id  uuid references public.services (id) on delete set null,
  description text not null,
  quantity    integer not null default 1 check (quantity > 0),
  sort_order  integer not null default 0
);

create index package_items_package_idx on public.package_items (package_id);
