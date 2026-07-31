import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getServiceCategories } from '@/lib/data/categories';
import { CategoryIcon } from '@/components/category-icon';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Categorias',
};

export default async function CategoriesPage() {
  const categories = await getServiceCategories();

  return (
    <div className="container py-10">
      <div className="mb-8">
        <span className="eyebrow">Categorias</span>
        <h1 className="mt-1 text-3xl font-semibold">Explore por tipo de serviço</h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Do buffet completo à decoração, encontre exatamente o que seu evento precisa.
        </p>
      </div>

      {categories.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/busca?category=${category.slug}`}
              className="group flex flex-col gap-3 rounded-lg border border-border bg-card p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lift"
            >
              <span className="grid h-11 w-11 place-items-center rounded-md bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <CategoryIcon slug={category.slug} className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-display text-lg font-semibold">{category.name}</h2>
                {category.description ? (
                  <p className="mt-1 text-sm text-muted-foreground">{category.description}</p>
                ) : null}
              </div>
              <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-primary">
                Ver fornecedores <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border bg-secondary/40 p-12 text-center text-muted-foreground">
          As categorias aparecerão aqui em breve.
        </div>
      )}
    </div>
  );
}
