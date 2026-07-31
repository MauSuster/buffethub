-- =============================================================================
-- 0005 — Row Level Security
-- =============================================================================
-- As funções abaixo são SECURITY DEFINER: executam com o dono (postgres) e,
-- portanto, ignoram RLS. Isso evita recursão de políticas (policy que consulta
-- tabela cuja policy consulta a primeira) e centraliza as regras de visibilidade.
-- O papel `service_role` do Supabase tem BYPASSRLS: o painel admin opera por ele.

-- -----------------------------------------------------------------------------
-- Funções auxiliares
-- -----------------------------------------------------------------------------
create or replace function public.is_staff()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role in ('SUPPORT', 'FINANCIAL', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN')
  );
$$;

create or replace function public.is_provider_member(p_provider_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.providers p where p.id = p_provider_id and p.owner_id = auth.uid()
  ) or exists (
    select 1 from public.provider_members m
    where m.provider_id = p_provider_id and m.user_id = auth.uid() and m.is_active
  );
$$;

create or replace function public.can_manage_provider(p_provider_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.providers p where p.id = p_provider_id and p.owner_id = auth.uid()
  ) or exists (
    select 1 from public.provider_members m
    where m.provider_id = p_provider_id and m.user_id = auth.uid() and m.is_active
      and m.role in ('PROVIDER_OWNER', 'PROVIDER_MANAGER')
  );
$$;

create or replace function public.provider_is_public(p_provider_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.providers p
    where p.id = p_provider_id and p.status = 'APPROVED' and p.deleted_at is null
  );
$$;

create or replace function public.provider_of_service(p_service_id uuid)
returns uuid
language sql stable security definer set search_path = public
as $$
  select provider_id from public.services where id = p_service_id;
$$;

create or replace function public.service_is_public(p_service_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.services s
    join public.providers p on p.id = s.provider_id
    where s.id = p_service_id and s.status = 'PUBLISHED' and s.deleted_at is null
      and p.status = 'APPROVED' and p.deleted_at is null
  );
$$;

create or replace function public.provider_of_menu(p_menu_id uuid)
returns uuid
language sql stable security definer set search_path = public
as $$
  select provider_id from public.menus where id = p_menu_id;
$$;

create or replace function public.menu_is_public(p_menu_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.menus mn
    join public.providers p on p.id = mn.provider_id
    where mn.id = p_menu_id and mn.is_active and mn.deleted_at is null
      and p.status = 'APPROVED' and p.deleted_at is null
  );
$$;

create or replace function public.menu_of_section(p_section_id uuid)
returns uuid
language sql stable security definer set search_path = public
as $$
  select menu_id from public.menu_sections where id = p_section_id;
$$;

create or replace function public.provider_of_package(p_package_id uuid)
returns uuid
language sql stable security definer set search_path = public
as $$
  select provider_id from public.packages where id = p_package_id;
$$;

create or replace function public.package_is_public(p_package_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.packages pk
    join public.providers p on p.id = pk.provider_id
    where pk.id = p_package_id and pk.status = 'PUBLISHED' and pk.deleted_at is null
      and p.status = 'APPROVED' and p.deleted_at is null
  );
$$;

-- =============================================================================
-- Habilitação de RLS e políticas
-- =============================================================================

-- profiles ---------------------------------------------------------------------
alter table public.profiles enable row level security;

create policy profiles_select on public.profiles
  for select using (id = auth.uid() or public.is_staff());
create policy profiles_insert on public.profiles
  for insert with check (id = auth.uid());
create policy profiles_update on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- user_roles -------------------------------------------------------------------
alter table public.user_roles enable row level security;

create policy user_roles_select on public.user_roles
  for select using (user_id = auth.uid() or public.is_staff());
create policy user_roles_admin_write on public.user_roles
  for all using (public.is_staff()) with check (public.is_staff());

-- addresses --------------------------------------------------------------------
alter table public.addresses enable row level security;

create policy addresses_all on public.addresses
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- user_consents (append-only) --------------------------------------------------
alter table public.user_consents enable row level security;

create policy user_consents_select on public.user_consents
  for select using (user_id = auth.uid() or public.is_staff());
create policy user_consents_insert on public.user_consents
  for insert with check (user_id = auth.uid());

-- user_devices -----------------------------------------------------------------
alter table public.user_devices enable row level security;

create policy user_devices_all on public.user_devices
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- user_sessions ----------------------------------------------------------------
alter table public.user_sessions enable row level security;

create policy user_sessions_select on public.user_sessions
  for select using (user_id = auth.uid() or public.is_staff());
create policy user_sessions_update on public.user_sessions
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- providers --------------------------------------------------------------------
alter table public.providers enable row level security;

create policy providers_select on public.providers
  for select using (
    (status = 'APPROVED' and deleted_at is null)
    or public.is_provider_member(id)
    or public.is_staff()
  );
create policy providers_insert on public.providers
  for insert with check (owner_id = auth.uid());
create policy providers_update on public.providers
  for update using (public.can_manage_provider(id) or public.is_staff())
  with check (public.can_manage_provider(id) or public.is_staff());

-- provider_members -------------------------------------------------------------
alter table public.provider_members enable row level security;

create policy provider_members_select on public.provider_members
  for select using (public.is_provider_member(provider_id) or public.is_staff());
create policy provider_members_write on public.provider_members
  for all using (public.can_manage_provider(provider_id) or public.is_staff())
  with check (public.can_manage_provider(provider_id) or public.is_staff());

-- provider_documents (privado) -------------------------------------------------
alter table public.provider_documents enable row level security;

create policy provider_documents_select on public.provider_documents
  for select using (public.is_provider_member(provider_id) or public.is_staff());
create policy provider_documents_insert on public.provider_documents
  for insert with check (public.can_manage_provider(provider_id));
create policy provider_documents_update on public.provider_documents
  for update using (public.can_manage_provider(provider_id) or public.is_staff())
  with check (public.can_manage_provider(provider_id) or public.is_staff());

-- provider_service_areas -------------------------------------------------------
alter table public.provider_service_areas enable row level security;

create policy provider_service_areas_select on public.provider_service_areas
  for select using (
    public.provider_is_public(provider_id)
    or public.is_provider_member(provider_id)
    or public.is_staff()
  );
create policy provider_service_areas_write on public.provider_service_areas
  for all using (public.can_manage_provider(provider_id))
  with check (public.can_manage_provider(provider_id));

-- provider_business_hours ------------------------------------------------------
alter table public.provider_business_hours enable row level security;

create policy provider_business_hours_select on public.provider_business_hours
  for select using (
    public.provider_is_public(provider_id)
    or public.is_provider_member(provider_id)
    or public.is_staff()
  );
create policy provider_business_hours_write on public.provider_business_hours
  for all using (public.can_manage_provider(provider_id))
  with check (public.can_manage_provider(provider_id));

-- provider_bank_accounts (sensível) --------------------------------------------
alter table public.provider_bank_accounts enable row level security;

create policy provider_bank_accounts_select on public.provider_bank_accounts
  for select using (public.can_manage_provider(provider_id) or public.is_staff());
create policy provider_bank_accounts_write on public.provider_bank_accounts
  for all using (public.can_manage_provider(provider_id))
  with check (public.can_manage_provider(provider_id));

-- provider_verifications -------------------------------------------------------
alter table public.provider_verifications enable row level security;

create policy provider_verifications_select on public.provider_verifications
  for select using (public.is_provider_member(provider_id) or public.is_staff());
create policy provider_verifications_insert on public.provider_verifications
  for insert with check (public.is_staff());

-- categories / subcategories ---------------------------------------------------
alter table public.categories enable row level security;
create policy categories_select on public.categories
  for select using (is_active or public.is_staff());
create policy categories_write on public.categories
  for all using (public.is_staff()) with check (public.is_staff());

alter table public.subcategories enable row level security;
create policy subcategories_select on public.subcategories
  for select using (is_active or public.is_staff());
create policy subcategories_write on public.subcategories
  for all using (public.is_staff()) with check (public.is_staff());

-- provider_categories ----------------------------------------------------------
alter table public.provider_categories enable row level security;
create policy provider_categories_select on public.provider_categories
  for select using (
    public.provider_is_public(provider_id)
    or public.is_provider_member(provider_id)
    or public.is_staff()
  );
create policy provider_categories_write on public.provider_categories
  for all using (public.can_manage_provider(provider_id))
  with check (public.can_manage_provider(provider_id));

-- services ---------------------------------------------------------------------
alter table public.services enable row level security;
create policy services_select on public.services
  for select using (
    (status = 'PUBLISHED' and deleted_at is null and public.provider_is_public(provider_id))
    or public.is_provider_member(provider_id)
    or public.is_staff()
  );
create policy services_write on public.services
  for all using (public.can_manage_provider(provider_id))
  with check (public.can_manage_provider(provider_id));

-- service_media / service_items ------------------------------------------------
alter table public.service_media enable row level security;
create policy service_media_select on public.service_media
  for select using (
    public.service_is_public(service_id)
    or public.is_provider_member(public.provider_of_service(service_id))
    or public.is_staff()
  );
create policy service_media_write on public.service_media
  for all using (public.can_manage_provider(public.provider_of_service(service_id)))
  with check (public.can_manage_provider(public.provider_of_service(service_id)));

alter table public.service_items enable row level security;
create policy service_items_select on public.service_items
  for select using (
    public.service_is_public(service_id)
    or public.is_provider_member(public.provider_of_service(service_id))
    or public.is_staff()
  );
create policy service_items_write on public.service_items
  for all using (public.can_manage_provider(public.provider_of_service(service_id)))
  with check (public.can_manage_provider(public.provider_of_service(service_id)));

-- menus / sections / items -----------------------------------------------------
alter table public.menus enable row level security;
create policy menus_select on public.menus
  for select using (
    public.menu_is_public(id)
    or public.is_provider_member(provider_id)
    or public.is_staff()
  );
create policy menus_write on public.menus
  for all using (public.can_manage_provider(provider_id))
  with check (public.can_manage_provider(provider_id));

alter table public.menu_sections enable row level security;
create policy menu_sections_select on public.menu_sections
  for select using (
    public.menu_is_public(menu_id)
    or public.is_provider_member(public.provider_of_menu(menu_id))
    or public.is_staff()
  );
create policy menu_sections_write on public.menu_sections
  for all using (public.can_manage_provider(public.provider_of_menu(menu_id)))
  with check (public.can_manage_provider(public.provider_of_menu(menu_id)));

alter table public.menu_items enable row level security;
create policy menu_items_select on public.menu_items
  for select using (
    public.menu_is_public(public.menu_of_section(section_id))
    or public.is_provider_member(public.provider_of_menu(public.menu_of_section(section_id)))
    or public.is_staff()
  );
create policy menu_items_write on public.menu_items
  for all using (
    public.can_manage_provider(public.provider_of_menu(public.menu_of_section(section_id)))
  )
  with check (
    public.can_manage_provider(public.provider_of_menu(public.menu_of_section(section_id)))
  );

-- packages / package_items -----------------------------------------------------
alter table public.packages enable row level security;
create policy packages_select on public.packages
  for select using (
    (status = 'PUBLISHED' and deleted_at is null and public.provider_is_public(provider_id))
    or public.is_provider_member(provider_id)
    or public.is_staff()
  );
create policy packages_write on public.packages
  for all using (public.can_manage_provider(provider_id))
  with check (public.can_manage_provider(provider_id));

alter table public.package_items enable row level security;
create policy package_items_select on public.package_items
  for select using (
    public.package_is_public(package_id)
    or public.is_provider_member(public.provider_of_package(package_id))
    or public.is_staff()
  );
create policy package_items_write on public.package_items
  for all using (public.can_manage_provider(public.provider_of_package(package_id)))
  with check (public.can_manage_provider(public.provider_of_package(package_id)));
