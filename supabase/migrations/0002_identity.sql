-- =============================================================================
-- 0002 — Identidade: perfis, papéis, endereços, consentimentos, dispositivos
-- =============================================================================

-- -----------------------------------------------------------------------------
-- profiles — 1:1 com auth.users
-- -----------------------------------------------------------------------------
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  full_name    text not null check (char_length(full_name) between 3 and 120),
  phone        text check (phone ~ '^[0-9]{10,11}$'),
  avatar_url   text,
  birth_date   date,
  cpf          text check (cpf ~ '^[0-9]{11}$'),
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz
);

comment on table public.profiles is 'Perfil público/privado do usuário, vinculado a auth.users.';
comment on column public.profiles.cpf is 'Somente dígitos; coletado apenas quando necessário (LGPD).';

-- CPF único apenas entre registros não-nulos e não removidos.
create unique index profiles_cpf_key on public.profiles (cpf)
  where cpf is not null and deleted_at is null;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- user_roles — papéis de plataforma (RBAC)
-- -----------------------------------------------------------------------------
create table public.user_roles (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  role        public.user_role not null,
  granted_by  uuid references public.profiles (id),
  created_at  timestamptz not null default now(),
  unique (user_id, role)
);

comment on table public.user_roles is 'Papéis de plataforma por usuário. Vínculo com fornecedor fica em provider_members.';

create index user_roles_user_id_idx on public.user_roles (user_id);
create index user_roles_role_idx on public.user_roles (role);

-- -----------------------------------------------------------------------------
-- addresses — múltiplos endereços por usuário
-- -----------------------------------------------------------------------------
create table public.addresses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  label       text,
  cep         text not null check (cep ~ '^[0-9]{8}$'),
  street      text not null,
  number      text not null,
  complement  text,
  district    text not null,
  city        text not null,
  state       char(2) not null check (state ~ '^[A-Z]{2}$'),
  latitude    double precision check (latitude between -90 and 90),
  longitude   double precision check (longitude between -180 and 180),
  is_default  boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

comment on table public.addresses is 'Endereços do cliente (cobrança/evento). PostGIS pode substituir lat/long em produção.';

create index addresses_user_id_idx on public.addresses (user_id);
create index addresses_city_state_idx on public.addresses (city, state);
create index addresses_geo_idx on public.addresses (latitude, longitude);

-- Apenas um endereço padrão por usuário.
create unique index addresses_one_default_per_user
  on public.addresses (user_id)
  where is_default and deleted_at is null;

create trigger addresses_set_updated_at
  before update on public.addresses
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- user_consents — histórico append-only de consentimentos (LGPD)
-- -----------------------------------------------------------------------------
create table public.user_consents (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  consent_type  public.consent_type not null,
  granted       boolean not null,
  policy_version text not null default '1.0',
  ip_address    inet,
  user_agent    text,
  created_at    timestamptz not null default now()
);

comment on table public.user_consents is 'Registro imutável de consentimentos e revogações (LGPD, art. 8º).';

create index user_consents_user_id_idx on public.user_consents (user_id);
create index user_consents_type_idx on public.user_consents (consent_type);

-- -----------------------------------------------------------------------------
-- user_devices — dispositivos e tokens de push
-- -----------------------------------------------------------------------------
create table public.user_devices (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  platform    text not null check (platform in ('IOS', 'ANDROID', 'WEB')),
  push_token  text,
  device_name text,
  last_seen_at timestamptz not null default now(),
  revoked_at  timestamptz,
  created_at  timestamptz not null default now(),
  unique (user_id, push_token)
);

create index user_devices_user_id_idx on public.user_devices (user_id);

-- -----------------------------------------------------------------------------
-- user_sessions — espelho de sessões para revogação/controle
-- -----------------------------------------------------------------------------
create table public.user_sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  ip_address    inet,
  user_agent    text,
  last_active_at timestamptz not null default now(),
  revoked_at    timestamptz,
  created_at    timestamptz not null default now()
);

create index user_sessions_user_id_idx on public.user_sessions (user_id);
