/**
 * Enums de domínio — fonte única de verdade.
 *
 * Cada `as const` abaixo é espelhado por um `CREATE TYPE ... AS ENUM` nas
 * migrations do Postgres (ver `supabase/migrations`). Mantenha os valores em
 * sincronia: os testes de contrato de banco (a implementar em packages/database)
 * comparam estes arrays com os rótulos reais do enum no schema.
 */

// -------------------------------------------------------------------------
// Identidade e papéis
// -------------------------------------------------------------------------

export const USER_ROLES = [
  'CUSTOMER',
  'PROVIDER_OWNER',
  'PROVIDER_MANAGER',
  'PROVIDER_EMPLOYEE',
  'EVENT_PLANNER',
  'SUPPORT',
  'FINANCIAL',
  'MODERATOR',
  'ADMIN',
  'SUPER_ADMIN',
] as const;
export type UserRole = (typeof USER_ROLES)[number];

/** Papéis que representam a equipe interna da plataforma (acesso administrativo). */
export const STAFF_ROLES = [
  'SUPPORT',
  'FINANCIAL',
  'MODERATOR',
  'ADMIN',
  'SUPER_ADMIN',
] as const satisfies readonly UserRole[];

/** Papéis vinculados a um fornecedor. */
export const PROVIDER_ROLES = [
  'PROVIDER_OWNER',
  'PROVIDER_MANAGER',
  'PROVIDER_EMPLOYEE',
] as const satisfies readonly UserRole[];

export const CONSENT_TYPES = [
  'TERMS_OF_USE',
  'PRIVACY_POLICY',
  'MARKETING_EMAIL',
  'MARKETING_PUSH',
  'MARKETING_WHATSAPP',
  'COOKIES',
  'ANALYTICS',
] as const;
export type ConsentType = (typeof CONSENT_TYPES)[number];

// -------------------------------------------------------------------------
// Fornecedores
// -------------------------------------------------------------------------

export const PROVIDER_STATUS = [
  'DRAFT',
  'PENDING_REVIEW',
  'APPROVED',
  'REJECTED',
  'SUSPENDED',
  'BLOCKED',
] as const;
export type ProviderStatus = (typeof PROVIDER_STATUS)[number];

export const PROVIDER_DOCUMENT_TYPES = [
  'CNPJ_CARD',
  'IDENTITY',
  'ADDRESS_PROOF',
  'HEALTH_LICENSE',
  'FIRE_LICENSE',
  'BUSINESS_LICENSE',
  'BANK_PROOF',
  'OTHER',
] as const;
export type ProviderDocumentType = (typeof PROVIDER_DOCUMENT_TYPES)[number];

export const DOCUMENT_STATUS = ['PENDING', 'APPROVED', 'REJECTED'] as const;
export type DocumentStatus = (typeof DOCUMENT_STATUS)[number];

export const VERIFICATION_STATUS = ['UNVERIFIED', 'IN_REVIEW', 'VERIFIED', 'REVOKED'] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUS)[number];

// -------------------------------------------------------------------------
// Catálogo
// -------------------------------------------------------------------------

export const SERVICE_STATUS = ['DRAFT', 'PUBLISHED', 'PAUSED', 'ARCHIVED'] as const;
export type ServiceStatus = (typeof SERVICE_STATUS)[number];

export const PRICE_TYPES = [
  'FIXED',
  'PER_PERSON',
  'PER_HOUR',
  'PER_DAY',
  'CUSTOM_QUOTE',
  'STARTING_AT',
] as const;
export type PriceType = (typeof PRICE_TYPES)[number];

export const DIETARY_OPTIONS = [
  'VEGETARIAN',
  'VEGAN',
  'GLUTEN_FREE',
  'LACTOSE_FREE',
  'SUGAR_FREE',
  'HALAL',
  'KOSHER',
] as const;
export type DietaryOption = (typeof DIETARY_OPTIONS)[number];

// -------------------------------------------------------------------------
// Eventos, orçamentos e propostas
// -------------------------------------------------------------------------

export const EVENT_STATUS = [
  'DRAFT',
  'PLANNING',
  'REQUESTING_QUOTES',
  'NEGOTIATING',
  'BOOKED',
  'COMPLETED',
  'CANCELLED',
] as const;
export type EventStatus = (typeof EVENT_STATUS)[number];

export const QUOTE_REQUEST_STATUS = [
  'DRAFT',
  'SENT',
  'VIEWED',
  'ANSWERED',
  'NEGOTIATING',
  'ACCEPTED',
  'REJECTED',
  'EXPIRED',
  'CANCELLED',
] as const;
export type QuoteRequestStatus = (typeof QUOTE_REQUEST_STATUS)[number];

export const PROPOSAL_STATUS = [
  'DRAFT',
  'SENT',
  'VIEWED',
  'REVISION_REQUESTED',
  'ACCEPTED',
  'REJECTED',
  'EXPIRED',
  'CANCELLED',
] as const;
export type ProposalStatus = (typeof PROPOSAL_STATUS)[number];

// -------------------------------------------------------------------------
// Agenda e pedidos
// -------------------------------------------------------------------------

export const BOOKING_STATUS = ['HELD', 'CONFIRMED', 'RELEASED', 'CANCELLED'] as const;
export type BookingStatus = (typeof BOOKING_STATUS)[number];

export const ORDER_STATUS = [
  'PENDING_PAYMENT',
  'PARTIALLY_PAID',
  'PAID',
  'CONFIRMED',
  'IN_PREPARATION',
  'READY',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'DISPUTED',
  'REFUNDED',
  'PARTIALLY_REFUNDED',
] as const;
export type OrderStatus = (typeof ORDER_STATUS)[number];

// -------------------------------------------------------------------------
// Pagamentos e financeiro
// -------------------------------------------------------------------------

export const PAYMENT_STATUS = [
  'CREATED',
  'PENDING',
  'AUTHORIZED',
  'PAID',
  'FAILED',
  'CANCELLED',
  'REFUNDED',
  'PARTIALLY_REFUNDED',
  'CHARGEBACK',
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUS)[number];

export const PAYMENT_METHODS = [
  'PIX',
  'CREDIT_CARD',
  'DEBIT_CARD',
  'BOLETO',
  'PAYMENT_LINK',
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_PROVIDERS = ['MERCADO_PAGO', 'PAGARME', 'STRIPE', 'ASAAS'] as const;
export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[number];

export const LEDGER_ENTRY_TYPES = [
  'CHARGE',
  'PLATFORM_FEE',
  'GATEWAY_FEE',
  'PAYOUT',
  'REFUND',
  'CHARGEBACK',
  'ADJUSTMENT',
] as const;
export type LedgerEntryType = (typeof LEDGER_ENTRY_TYPES)[number];

export const PAYOUT_STATUS = ['PENDING', 'PROCESSING', 'PAID', 'FAILED', 'REVERSED'] as const;
export type PayoutStatus = (typeof PAYOUT_STATUS)[number];

export const COMMISSION_TYPES = ['PERCENTAGE', 'FIXED', 'CATEGORY', 'PLAN', 'CUSTOM'] as const;
export type CommissionType = (typeof COMMISSION_TYPES)[number];

// -------------------------------------------------------------------------
// Assinaturas
// -------------------------------------------------------------------------

export const PLAN_TIERS = ['FREE', 'PROFESSIONAL', 'PREMIUM'] as const;
export type PlanTier = (typeof PLAN_TIERS)[number];

export const BILLING_CYCLES = ['MONTHLY', 'YEARLY'] as const;
export type BillingCycle = (typeof BILLING_CYCLES)[number];

export const SUBSCRIPTION_STATUS = [
  'TRIALING',
  'ACTIVE',
  'PAST_DUE',
  'CANCELLED',
  'EXPIRED',
] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUS)[number];

// -------------------------------------------------------------------------
// Avaliações, suporte, notificações
// -------------------------------------------------------------------------

export const MODERATION_STATUS = ['PENDING', 'APPROVED', 'REJECTED', 'HIDDEN'] as const;
export type ModerationStatus = (typeof MODERATION_STATUS)[number];

export const SUPPORT_TICKET_STATUS = [
  'OPEN',
  'WAITING_CUSTOMER',
  'WAITING_PROVIDER',
  'IN_PROGRESS',
  'RESOLVED',
  'CLOSED',
] as const;
export type SupportTicketStatus = (typeof SUPPORT_TICKET_STATUS)[number];

export const TICKET_PRIORITY = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;
export type TicketPriority = (typeof TICKET_PRIORITY)[number];

export const DISPUTE_STATUS = [
  'OPEN',
  'UNDER_REVIEW',
  'RESOLVED_CUSTOMER',
  'RESOLVED_PROVIDER',
  'RESOLVED_SPLIT',
  'CLOSED',
] as const;
export type DisputeStatus = (typeof DISPUTE_STATUS)[number];

export const NOTIFICATION_CHANNELS = ['IN_APP', 'PUSH', 'EMAIL', 'WHATSAPP'] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

export const COUPON_TYPES = ['PERCENTAGE', 'FIXED'] as const;
export type CouponType = (typeof COUPON_TYPES)[number];

export const CONVERSATION_CONTEXTS = ['QUOTE', 'ORDER', 'SUPPORT'] as const;
export type ConversationContext = (typeof CONVERSATION_CONTEXTS)[number];

export const MESSAGE_KINDS = ['USER', 'SYSTEM'] as const;
export type MessageKind = (typeof MESSAGE_KINDS)[number];
