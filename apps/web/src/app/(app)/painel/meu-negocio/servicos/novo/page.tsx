// apps/web/src/app/(app)/painel/meu-negocio/servicos/novo/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, PackagePlus } from 'lucide-react';
import { redirect } from 'next/navigation';

import { ServiceForm } from '@/components/forms/service-form';
import { getServiceCategories } from '@/lib/data/categories';
import { getMyProvider, getSessionUser } from '@/lib/data/session';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Cadastrar serviço',
};

export default async function NewServicePage() {
  const user = await getSessionUser();

  if (!user) {
    redirect('/entrar');
  }

  const provider = await getMyProvider(user.id);

  if (!provider) {
    redirect('/painel/meu-negocio');
  }

  const categories = await getServiceCategories();

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <Link
        href="/painel/meu-negocio/servicos"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para os serviços
      </Link>

      <header>
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <PackagePlus className="h-4 w-4" />
          Novo serviço
        </div>

        <h1 className="mt-2 font-display text-2xl font-semibold sm:text-3xl">
          Cadastrar produto ou serviço
        </h1>

        <p className="mt-1 text-sm leading-6 text-muted-foreground sm:text-base">
          Preencha as informações do serviço que será exibido no perfil de{' '}
          <strong className="font-semibold text-foreground">
            {provider.trade_name}
          </strong>
          .
        </p>
      </header>

      <ServiceForm
        categories={categories.map((category) => ({
          id: category.id,
          name: category.name,
        }))}
      />
    </div>
  );
}