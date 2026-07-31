import type { ProviderStatus } from '@buffethub/domain';

type BadgeVariant = 'default' | 'primary' | 'accent' | 'success' | 'outline';

export const providerStatusMeta: Record<
  ProviderStatus,
  { label: string; variant: BadgeVariant; hint: string }
> = {
  DRAFT: { label: 'Rascunho', variant: 'outline', hint: 'Complete o cadastro para enviar à análise.' },
  PENDING_REVIEW: {
    label: 'Em análise',
    variant: 'accent',
    hint: 'Recebemos seu cadastro. Avisaremos assim que for aprovado.',
  },
  APPROVED: {
    label: 'Aprovado',
    variant: 'success',
    hint: 'Seu perfil está público no BuffetHub.',
  },
  REJECTED: {
    label: 'Recusado',
    variant: 'default',
    hint: 'Revise os dados e entre em contato com o suporte.',
  },
  SUSPENDED: { label: 'Suspenso', variant: 'default', hint: 'Seu perfil está temporariamente fora do ar.' },
  BLOCKED: { label: 'Bloqueado', variant: 'default', hint: 'Entre em contato com o suporte.' },
};
