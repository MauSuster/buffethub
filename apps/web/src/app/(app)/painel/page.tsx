// apps/web/src/app/(app)/painel/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  Building2,
  PackagePlus,
  Settings,
  Store,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { getMyProvider, getProfile, getSessionUser } from '@/lib/data/session';
import { providerStatusMeta } from '@/lib/provider-status';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Painel',
};

export default async function PainelPage() {
  const user = await getSessionUser();

  if (!user) {
    return null;
  }

  const [profile, provider] = await Promise.all([
    getProfile(user.id),
    getMyProvider(user.id),
  ]);

  const firstName = profile?.full_name?.trim().split(/\s+/)[0] ?? '';

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Cabeçalho */}
      <header>
        <h1 className="font-display text-2xl font-semibold sm:text-3xl">
          Olá{firstName ? `, ${firstName}` : ''} 👋
        </h1>

        <p className="mt-1 text-sm text-muted-foreground sm:text-base">
          Gerencie seu negócio e seus serviços no BuffetHub.
        </p>
      </header>

      {/* Negócio cadastrado */}
      <section className="rounded-xl border border-border bg-card p-4 shadow-card sm:p-6">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Store className="h-4 w-4" />
          Seu negócio
        </div>

        {provider ? (
          <div className="mt-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <h2 className="break-words font-display text-xl font-semibold">
                  {provider.trade_name}
                </h2>

                <div className="mt-2 flex flex-col items-start gap-2 sm:flex-row sm:items-center">
                  <Badge variant={providerStatusMeta[provider.status].variant}>
                    {providerStatusMeta[provider.status].label}
                  </Badge>

                  <span className="text-sm text-muted-foreground">
                    {providerStatusMeta[provider.status].hint}
                  </span>
                </div>
              </div>

              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row lg:justify-end">
                <Link
                  href="/painel/meu-negocio"
                  className={cn(
                    buttonVariants({
                      variant: 'outline',
                      size: 'sm',
                    }),
                    'w-full justify-center sm:w-auto',
                  )}
                >
                  <Settings className="h-4 w-4" />
                  Editar negócio
                </Link>

                <Link
                  href="/painel/meu-negocio/servicos"
                  className={cn(
                    buttonVariants({
                      variant: 'primary',
                      size: 'sm',
                    }),
                    'w-full justify-center sm:w-auto',
                  )}
                >
                  <PackagePlus className="h-4 w-4" />
                  Gerenciar serviços
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Atalhos */}
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Link
                href="/painel/meu-negocio"
                className="group rounded-xl border border-border bg-background p-4 transition-colors hover:bg-secondary/50"
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-secondary p-2">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold">Dados do negócio</h3>

                    <p className="mt-1 text-sm leading-5 text-muted-foreground">
                      Atualize nome, descrição, endereço, imagens e contatos.
                    </p>
                  </div>

                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </div>
              </Link>

              <Link
                href="/painel/meu-negocio/servicos"
                className="group rounded-xl border border-border bg-background p-4 transition-colors hover:bg-secondary/50"
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <PackagePlus className="h-5 w-5 text-primary" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold">Produtos e serviços</h3>

                    <p className="mt-1 text-sm leading-5 text-muted-foreground">
                      Cadastre pacotes, preços e serviços oferecidos.
                    </p>
                  </div>

                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-4">
            <h2 className="font-display text-xl font-semibold">
              Você ainda não cadastrou um negócio
            </h2>

            <p className="mt-1 max-w-lg text-sm leading-6 text-muted-foreground">
              Publique seu buffet ou serviço de eventos para começar a cadastrar
              produtos e receber pedidos de orçamento.
            </p>

            <Link
              href="/painel/meu-negocio"
              className={cn(
                buttonVariants({
                  variant: 'primary',
                }),
                'mt-4 w-full justify-center sm:w-auto',
              )}
            >
              Cadastrar meu negócio
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}