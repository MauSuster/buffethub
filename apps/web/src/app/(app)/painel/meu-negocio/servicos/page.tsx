// apps/web/src/app/(app)/painel/meu-negocio/servicos/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import {
  ArrowLeft,
  DollarSign,
  Package,
  PackagePlus,
  Pencil,
  Star,
} from 'lucide-react';

import type { Tables } from '@buffethub/database';
import { formatBRL } from '@buffethub/utils';

import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { getProviderServices } from '@/lib/data/providers';
import { getMyProvider, getSessionUser } from '@/lib/data/session';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Meus serviços',
};

function formatServicePrice(service: Tables<'services'>): string {
  if (
    service.price_type === 'CUSTOM_QUOTE' ||
    service.base_price_cents == null
  ) {
    return 'Sob orçamento';
  }

  const value = formatBRL(service.base_price_cents);

  switch (service.price_type) {
    case 'PER_PERSON':
      return `${value} por pessoa`;

    case 'PER_HOUR':
      return `${value} por hora`;

    case 'PER_DAY':
      return `${value} por dia`;

    case 'STARTING_AT':
      return `A partir de ${value}`;

    default:
      return value;
  }
}

export default async function ProviderServicesPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect('/entrar');
  }

  const provider = await getMyProvider(user.id);

  if (!provider) {
    redirect('/painel/meu-negocio');
  }

  const services = await getProviderServices(provider.id);

  if (!provider) {
    notFound();
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Navegação */}
      <Link
        href="/painel"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para o painel
      </Link>

      {/* Cabeçalho */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <Package className="h-4 w-4" />
            {provider.trade_name}
          </div>

          <h1 className="mt-2 font-display text-2xl font-semibold sm:text-3xl">
            Produtos e serviços
          </h1>

          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Cadastre os serviços, pacotes e produtos que seu negócio oferece aos
            clientes.
          </p>
        </div>

        <Link
          href="/painel/meu-negocio/servicos/novo"
          className={cn(
            buttonVariants({
              variant: 'primary',
            }),
            'w-full justify-center sm:w-auto',
          )}
        >
          <PackagePlus className="h-4 w-4" />
          Cadastrar serviço
        </Link>
      </header>

      {/* Listagem */}
      {services.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => (
            <article
              key={service.id}
              className="flex min-w-0 flex-col rounded-xl border border-border bg-card p-5 shadow-card"
            >
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="break-words font-display text-lg font-semibold">
                    {service.name}
                  </h2>

                  {service.short_description ? (
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
                      {service.short_description}
                    </p>
                  ) : (
                    <p className="mt-2 text-sm italic text-muted-foreground">
                      Sem descrição cadastrada.
                    </p>
                  )}
                </div>

                {service.is_featured ? (
                  <Badge variant="accent" className="shrink-0">
                    <Star className="h-3.5 w-3.5" />
                    Destaque
                  </Badge>
                ) : null}
              </div>

              <div className="mt-5 flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-primary" />

                <span className="font-semibold text-primary">
                  {formatServicePrice(service)}
                </span>
              </div>

              <div className="mt-auto pt-5">
                <Link
                  href={`/painel/meu-negocio/servicos/${service.id}`}
                  className={cn(
                    buttonVariants({
                      variant: 'outline',
                      size: 'sm',
                    }),
                    'w-full justify-center',
                  )}
                >
                  <Pencil className="h-4 w-4" />
                  Editar serviço
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <section className="rounded-xl border border-dashed border-border bg-card px-5 py-12 text-center sm:px-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <PackagePlus className="h-7 w-7 text-primary" />
          </div>

          <h2 className="mt-4 font-display text-xl font-semibold">
            Nenhum serviço cadastrado
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            Cadastre seu primeiro serviço, pacote de buffet ou produto para que
            ele apareça no perfil público do seu negócio.
          </p>

          <Link
            href="/painel/meu-negocio/servicos/novo"
            className={cn(
              buttonVariants({
                variant: 'primary',
              }),
              'mt-5',
            )}
          >
            <PackagePlus className="h-4 w-4" />
            Cadastrar primeiro serviço
          </Link>
        </section>
      )}
    </div>
  );
}