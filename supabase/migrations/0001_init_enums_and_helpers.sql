-- =============================================================================
-- 0001 — Fundação: funções utilitárias e enums de domínio
-- =============================================================================
-- gen_random_uuid() é nativo do PostgreSQL 13+ (não requer extensão).
-- No Supabase, o schema `auth` (auth.users, auth.uid()) já existe.

-- -----------------------------------------------------------------------------
-- Trigger genérico para manter updated_at
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'Atualiza a coluna updated_at para now() em qualquer UPDATE.';

-- -----------------------------------------------------------------------------
-- Enums de domínio (espelham packages/domain/src/enums.ts)
-- -----------------------------------------------------------------------------
create type public.user_role as enum (
  'CUSTOMER', 'PROVIDER_OWNER', 'PROVIDER_MANAGER', 'PROVIDER_EMPLOYEE',
  'EVENT_PLANNER', 'SUPPORT', 'FINANCIAL', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN'
);

create type public.consent_type as enum (
  'TERMS_OF_USE', 'PRIVACY_POLICY', 'MARKETING_EMAIL', 'MARKETING_PUSH',
  'MARKETING_WHATSAPP', 'COOKIES', 'ANALYTICS'
);

create type public.provider_status as enum (
  'DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'SUSPENDED', 'BLOCKED'
);

create type public.provider_document_type as enum (
  'CNPJ_CARD', 'IDENTITY', 'ADDRESS_PROOF', 'HEALTH_LICENSE', 'FIRE_LICENSE',
  'BUSINESS_LICENSE', 'BANK_PROOF', 'OTHER'
);

create type public.document_status as enum ('PENDING', 'APPROVED', 'REJECTED');

create type public.verification_status as enum (
  'UNVERIFIED', 'IN_REVIEW', 'VERIFIED', 'REVOKED'
);

create type public.service_status as enum (
  'DRAFT', 'PUBLISHED', 'PAUSED', 'ARCHIVED'
);

create type public.price_type as enum (
  'FIXED', 'PER_PERSON', 'PER_HOUR', 'PER_DAY', 'CUSTOM_QUOTE', 'STARTING_AT'
);

create type public.dietary_option as enum (
  'VEGETARIAN', 'VEGAN', 'GLUTEN_FREE', 'LACTOSE_FREE', 'SUGAR_FREE', 'HALAL', 'KOSHER'
);

create type public.event_status as enum (
  'DRAFT', 'PLANNING', 'REQUESTING_QUOTES', 'NEGOTIATING', 'BOOKED', 'COMPLETED', 'CANCELLED'
);

create type public.quote_request_status as enum (
  'DRAFT', 'SENT', 'VIEWED', 'ANSWERED', 'NEGOTIATING', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED'
);

create type public.proposal_status as enum (
  'DRAFT', 'SENT', 'VIEWED', 'REVISION_REQUESTED', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED'
);

create type public.booking_status as enum ('HELD', 'CONFIRMED', 'RELEASED', 'CANCELLED');

create type public.order_status as enum (
  'PENDING_PAYMENT', 'PARTIALLY_PAID', 'PAID', 'CONFIRMED', 'IN_PREPARATION', 'READY',
  'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DISPUTED', 'REFUNDED', 'PARTIALLY_REFUNDED'
);

create type public.payment_status as enum (
  'CREATED', 'PENDING', 'AUTHORIZED', 'PAID', 'FAILED', 'CANCELLED',
  'REFUNDED', 'PARTIALLY_REFUNDED', 'CHARGEBACK'
);

create type public.payment_method as enum (
  'PIX', 'CREDIT_CARD', 'DEBIT_CARD', 'BOLETO', 'PAYMENT_LINK'
);

create type public.payment_provider as enum ('MERCADO_PAGO', 'PAGARME', 'STRIPE', 'ASAAS');

create type public.plan_tier as enum ('FREE', 'PROFESSIONAL', 'PREMIUM');

create type public.billing_cycle as enum ('MONTHLY', 'YEARLY');

create type public.subscription_status as enum (
  'TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED'
);

create type public.moderation_status as enum ('PENDING', 'APPROVED', 'REJECTED', 'HIDDEN');

create type public.conversation_context as enum ('QUOTE', 'ORDER', 'SUPPORT');

create type public.message_kind as enum ('USER', 'SYSTEM');
