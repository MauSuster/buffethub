import type { Metadata } from 'next';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { maskCEP, maskCNPJ, maskCPF, maskPhoneBR } from '@buffethub/utils';
import { getMyProvider, getSessionUser } from '@/lib/data/session';
import { getServiceCategories } from '@/lib/data/categories';
import { providerStatusMeta } from '@/lib/provider-status';
import { ProviderRegistrationForm } from '@/components/forms/provider-registration-form';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Meu negócio' };

export default async function MeuNegocioPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const provider = await getMyProvider(user.id);

  if (!provider) {
    const categories = await getServiceCategories();
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-semibold">Cadastre seu negócio</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Preencha os dados abaixo para criar seu perfil de fornecedor. Após o envio, seu
            cadastro passa por uma análise antes de ficar público.
          </p>
        </div>
        <ProviderRegistrationForm
          categories={categories.map((category) => ({
            slug: category.slug,
            name: category.name,
          }))}
        />
      </div>
    );
  }

  const status = providerStatusMeta[provider.status];
  const documentMasked =
    provider.document_type === 'CNPJ' ? maskCNPJ(provider.document) : maskCPF(provider.document);
  const address = [
    provider.street && provider.number ? `${provider.street}, ${provider.number}` : provider.street,
    provider.district,
    provider.city && provider.state ? `${provider.city}/${provider.state}` : provider.city,
    provider.cep ? maskCEP(provider.cep) : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">{provider.trade_name}</h1>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant={status.variant}>{status.label}</Badge>
            <span className="text-sm text-muted-foreground">{status.hint}</span>
          </div>
        </div>
        {provider.status === 'APPROVED' ? (
          <Link
            href={`/fornecedores/${provider.slug}`}
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            Ver página pública <ExternalLink className="h-4 w-4" />
          </Link>
        ) : null}
      </div>

      <dl className="grid gap-px overflow-hidden rounded-xl border border-border bg-border text-sm shadow-card sm:grid-cols-2">
        <Row label="Razão social" value={provider.legal_name} />
        <Row label={provider.document_type} value={documentMasked} />
        <Row label="E-mail comercial" value={provider.business_email} />
        <Row label="Telefone" value={maskPhoneBR(provider.phone)} />
        {provider.whatsapp ? <Row label="WhatsApp" value={maskPhoneBR(provider.whatsapp)} /> : null}
        {provider.instagram ? <Row label="Instagram" value={provider.instagram} /> : null}
        <Row label="Endereço" value={address || '—'} full />
        <Row label="Descrição" value={provider.description} full />
      </dl>
    </div>
  );
}

function Row({ label, value, full }: { label: string; value: string; full?: boolean }) {
  return (
    <div className={`bg-card p-4 ${full ? 'sm:col-span-2' : ''}`}>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 whitespace-pre-line text-foreground">{value}</dd>
    </div>
  );
}
