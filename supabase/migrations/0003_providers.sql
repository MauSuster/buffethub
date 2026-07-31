-- =============================================================================
-- 0003 — Fornecedores e entidades relacionadas
-- =============================================================================

create table public.providers (
  id                    uuid primary key default gen_random_uuid(),
  owner_id              uuid not null references public.profiles (id) on delete restrict,
  legal_name            text not null,
  trade_name            text not null,
  slug                  text not null,
  document              text not null check (document ~ '^[0-9]{11}$' or document ~ '^[0-9]{14}$'),
  document_type         text not null check (document_type in ('CPF', 'CNPJ')),
  state_registration    text,
  business_email        text not null,
  phone                 text not null check (phone ~ '^[0-9]{10,11}$'),
  whatsapp              text check (whatsapp ~ '^[0-9]{10,11}$'),
  website               text,
  instagram             text,
  description           text not null,
  founded_year          smallint check (founded_year between 1900 and 2200),
  employee_count        integer check (employee_count >= 0),
  logo_url              text,
  banner_url            text,
  status                public.provider_status not null default 'DRAFT',
  verification_status   public.verification_status not null default 'UNVERIFIED',
  -- Endereço-sede
  cep                   text check (cep ~ '^[0-9]{8}$'),
  street                text,
  number                text,
  complement            text,
  district              text,
  city                  text,
  state                 char(2) check (state ~ '^[A-Z]{2}$'),
  latitude              double precision check (latitude between -90 and 90),
  longitude             double precision check (longitude between -180 and 180),
  service_radius_km     integer check (service_radius_km between 0 and 2000),
  -- Comercial
  min_capacity          integer check (min_capacity >= 0),
  max_capacity          integer check (max_capacity >= 0),
  price_range_min_cents bigint check (price_range_min_cents >= 0),
  price_range_max_cents bigint check (price_range_max_cents >= 0),
  cancellation_policy   text,
  -- Métricas denormalizadas (atualizadas por trigger/job)
  avg_response_minutes  integer,
  rating_avg            numeric(3, 2) not null default 0 check (rating_avg between 0 and 5),
  rating_count          integer not null default 0 check (rating_count >= 0),
  bookings_count        integer not null default 0 check (bookings_count >= 0),
  approved_at           timestamptz,
  rejected_reason       text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  deleted_at            timestamptz,
  constraint providers_capacity_order check (
    min_capacity is null or max_capacity is null or min_capacity <= max_capacity
  ),
  constraint providers_price_order check (
    price_range_min_cents is null or price_range_max_cents is null
    or price_range_min_cents <= price_range_max_cents
  )
);

comment on table public.providers is 'Empresa/prestador. status controla o ciclo de aprovação documental.';

create unique index providers_slug_key on public.providers (slug) where deleted_at is null;
create unique index providers_document_key on public.providers (document) where deleted_at is null;
create index providers_status_idx on public.providers (status);
create index providers_city_state_idx on public.providers (city, state);
create index providers_owner_idx on public.providers (owner_id);
create index providers_geo_idx on public.providers (latitude, longitude);
create index providers_rating_idx on public.providers (rating_avg desc);

create trigger providers_set_updated_at
  before update on public.providers
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- provider_members — equipe do fornecedor
-- -----------------------------------------------------------------------------
create table public.provider_members (
  id          uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  role        public.user_role not null
                check (role in ('PROVIDER_OWNER', 'PROVIDER_MANAGER', 'PROVIDER_EMPLOYEE')),
  permissions jsonb not null default '{}'::jsonb,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (provider_id, user_id)
);

create index provider_members_provider_idx on public.provider_members (provider_id);
create index provider_members_user_idx on public.provider_members (user_id);

create trigger provider_members_set_updated_at
  before update on public.provider_members
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- provider_documents — documentos privados para análise
-- -----------------------------------------------------------------------------
create table public.provider_documents (
  id            uuid primary key default gen_random_uuid(),
  provider_id   uuid not null references public.providers (id) on delete cascade,
  type          public.provider_document_type not null,
  storage_path  text not null,
  status        public.document_status not null default 'PENDING',
  reviewed_by   uuid references public.profiles (id),
  review_notes  text,
  expires_at    date,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.provider_documents is 'Documentos sensíveis; bucket privado, acesso apenas via RLS/staff.';

create index provider_documents_provider_idx on public.provider_documents (provider_id);
create index provider_documents_status_idx on public.provider_documents (status);

create trigger provider_documents_set_updated_at
  before update on public.provider_documents
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- provider_service_areas — cidades/regiões atendidas
-- -----------------------------------------------------------------------------
create table public.provider_service_areas (
  id          uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers (id) on delete cascade,
  city        text not null,
  state       char(2) not null check (state ~ '^[A-Z]{2}$'),
  radius_km   integer check (radius_km between 0 and 2000),
  created_at  timestamptz not null default now(),
  unique (provider_id, city, state)
);

create index provider_service_areas_city_idx on public.provider_service_areas (city, state);

-- -----------------------------------------------------------------------------
-- provider_business_hours — horário de funcionamento
-- -----------------------------------------------------------------------------
create table public.provider_business_hours (
  id          uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers (id) on delete cascade,
  weekday     smallint not null check (weekday between 0 and 6),
  opens_at    time,
  closes_at   time,
  is_closed   boolean not null default false,
  created_at  timestamptz not null default now(),
  constraint business_hours_time_order check (
    is_closed or (opens_at is not null and closes_at is not null and opens_at < closes_at)
  )
);

create index provider_business_hours_provider_idx on public.provider_business_hours (provider_id);

-- -----------------------------------------------------------------------------
-- provider_bank_accounts — dados bancários (sensível)
-- -----------------------------------------------------------------------------
create table public.provider_bank_accounts (
  id             uuid primary key default gen_random_uuid(),
  provider_id    uuid not null references public.providers (id) on delete cascade,
  bank_code      text,
  agency         text,
  account        text,
  account_type   text check (account_type in ('CHECKING', 'SAVINGS')),
  holder_name    text not null,
  holder_document text not null check (holder_document ~ '^[0-9]{11}$' or holder_document ~ '^[0-9]{14}$'),
  pix_key        text,
  pix_key_type   text check (pix_key_type in ('CPF', 'CNPJ', 'EMAIL', 'PHONE', 'RANDOM')),
  is_default     boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

comment on table public.provider_bank_accounts is 'Dados de repasse. Nunca públicos; acesso restrito ao dono e financeiro.';

create index provider_bank_accounts_provider_idx on public.provider_bank_accounts (provider_id);
create unique index provider_bank_accounts_one_default
  on public.provider_bank_accounts (provider_id) where is_default;

create trigger provider_bank_accounts_set_updated_at
  before update on public.provider_bank_accounts
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- provider_verifications — histórico de verificação
-- -----------------------------------------------------------------------------
create table public.provider_verifications (
  id          uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers (id) on delete cascade,
  status      public.verification_status not null,
  reviewer_id uuid references public.profiles (id),
  notes       text,
  created_at  timestamptz not null default now()
);

create index provider_verifications_provider_idx on public.provider_verifications (provider_id);
