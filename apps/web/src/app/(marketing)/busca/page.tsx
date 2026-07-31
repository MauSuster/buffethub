import type { Metadata } from 'next';
import { SearchX } from 'lucide-react';
import { UFS } from '@buffethub/validation';
import { getServiceCategories } from '@/lib/data/categories';
import { searchProviders, type ProviderSearchParams } from '@/lib/data/providers';
import { ProviderCard } from '@/components/provider-card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Explorar fornecedores',
};

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const params: ProviderSearchParams = {
    q: first(sp.q),
    category: first(sp.category),
    city: first(sp.city),
    state: first(sp.state),
  };

  const [categories, results] = await Promise.all([getServiceCategories(), searchProviders(params)]);
  const hasFilters = Boolean(params.q || params.category || params.city || params.state);

  return (
    <div className="container py-10">
      <div className="mb-6">
        <span className="eyebrow">Explorar</span>
        <h1 className="mt-1 text-3xl font-semibold">Encontre seu fornecedor</h1>
      </div>

      <form
        action="/busca"
        className="grid gap-3 rounded-lg border border-border bg-card p-4 shadow-card sm:grid-cols-2 lg:grid-cols-[1.6fr_1.2fr_1fr_0.8fr_auto] lg:items-end"
      >
        <Field label="Busca" htmlFor="q">
          <Input id="q" name="q" defaultValue={params.q ?? ''} placeholder="Nome ou descrição" />
        </Field>
        <Field label="Categoria" htmlFor="category">
          <Select id="category" name="category" defaultValue={params.category ?? ''}>
            <option value="">Todas</option>
            {categories.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Cidade" htmlFor="city">
          <Input id="city" name="city" defaultValue={params.city ?? ''} placeholder="Sua cidade" />
        </Field>
        <Field label="UF" htmlFor="state">
          <Select id="state" name="state" defaultValue={params.state ?? ''}>
            <option value="">Todas</option>
            {UFS.map((uf) => (
              <option key={uf} value={uf}>
                {uf}
              </option>
            ))}
          </Select>
        </Field>
        <Button type="submit" size="lg">
          Filtrar
        </Button>
      </form>

      <div className="mt-8">
        <p className="mb-4 text-sm text-muted-foreground">
          {results.length > 0
            ? `${results.length} ${results.length === 1 ? 'fornecedor encontrado' : 'fornecedores encontrados'}`
            : 'Nenhum resultado'}
        </p>

        {results.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((provider) => (
              <ProviderCard key={provider.id} provider={provider} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-secondary/40 p-12 text-center">
            <SearchX className="h-8 w-8 text-muted-foreground" />
            <p className="font-medium">
              {hasFilters
                ? 'Não encontramos fornecedores com esses filtros.'
                : 'Comece sua busca acima.'}
            </p>
            <p className="text-sm text-muted-foreground">
              Tente ampliar a área ou remover alguns filtros.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
