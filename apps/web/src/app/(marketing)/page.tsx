import Link from 'next/link';
import { ArrowRight, MessagesSquare, Search, ShieldCheck, Sparkles } from 'lucide-react';
import { getServiceCategories } from '@/lib/data/categories';
import { getFeaturedProviders } from '@/lib/data/providers';
import { ProviderCard } from '@/components/provider-card';
import { CategoryIcon } from '@/components/category-icon';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const STEPS = [
  {
    icon: Search,
    title: 'Busque e filtre',
    body: 'Explore fornecedores por categoria, cidade e capacidade do seu evento.',
  },
  {
    icon: MessagesSquare,
    title: 'Peça orçamentos',
    body: 'Envie sua demanda e receba propostas personalizadas direto dos fornecedores.',
  },
  {
    icon: ShieldCheck,
    title: 'Feche com segurança',
    body: 'Pagamento protegido e liberado ao fornecedor só após a confirmação.',
  },
];

export default async function HomePage() {
  const [categories, featured] = await Promise.all([getServiceCategories(), getFeaturedProviders(6)]);

  return (
    <div>
      {/* HERO — a assinatura: confete discreto sob um título editorial */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="confetti absolute inset-0 opacity-[0.5]" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background" aria-hidden />
        <div className="container relative py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <span className="eyebrow animate-fade-in">
              <Sparkles className="h-3.5 w-3.5" /> Marketplace de eventos
            </span>
            <h1 className="mt-4 animate-rise text-4xl font-semibold leading-[1.05] md:text-6xl">
              Do primeiro orçamento
              <br className="hidden sm:block" /> ao último brinde.
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
              Encontre buffets e fornecedores de eventos verificados, compare propostas e feche
              tudo em um só lugar — com segurança do começo ao fim.
            </p>

            <form
              action="/busca"
              className="mx-auto mt-8 flex max-w-xl flex-col gap-2 rounded-lg border border-border bg-card p-2 shadow-lift sm:flex-row"
            >
              <div className="flex flex-1 items-center gap-2 px-3">
                <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
                <input
                  name="q"
                  placeholder="Buffet, churrasco, doces, decoração…"
                  aria-label="Buscar fornecedores"
                  className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>
              <Button type="submit" size="lg" className="sm:w-auto">
                Buscar
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* CATEGORIAS */}
      {categories.length > 0 ? (
        <section className="container py-12">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <span className="eyebrow">Categorias</span>
              <h2 className="mt-1 text-2xl font-semibold">Para cada tipo de celebração</h2>
            </div>
            <Link
              href="/categorias"
              className="hidden items-center gap-1 text-sm font-medium text-primary hover:underline sm:inline-flex"
            >
              Ver todas <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {categories.slice(0, 8).map((category) => (
              <Link
                key={category.id}
                href={`/busca?category=${category.slug}`}
                className="group flex items-center gap-3 rounded-lg border border-border bg-card p-4 shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lift"
              >
                <span className="grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <CategoryIcon slug={category.slug} className="h-5 w-5" />
                </span>
                <span className="font-medium leading-tight">{category.name}</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* DESTAQUES */}
      <section className="container py-12">
        <div className="mb-6">
          <span className="eyebrow">Em destaque</span>
          <h2 className="mt-1 text-2xl font-semibold">Fornecedores bem avaliados</h2>
        </div>
        {featured.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((provider) => (
              <ProviderCard key={provider.id} provider={provider} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-secondary/40 p-10 text-center">
            <p className="font-medium">Em breve, novos fornecedores por aqui.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              É dono de um buffet ou serviço de eventos?{' '}
              <Link href="/cadastrar" className="text-primary hover:underline">
                Anuncie gratuitamente
              </Link>
              .
            </p>
          </div>
        )}
      </section>

      {/* COMO FUNCIONA — sequência real, por isso numerada */}
      <section className="border-y border-border bg-secondary/30">
        <div className="container py-16">
          <div className="mb-10 text-center">
            <span className="eyebrow">Como funciona</span>
            <h2 className="mt-1 text-2xl font-semibold md:text-3xl">Simples do início ao fim</h2>
          </div>
          <ol className="grid gap-6 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className="rounded-lg border border-border bg-card p-6 shadow-card">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <step.icon className="h-5 w-5 text-accent-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA FORNECEDORES */}
      <section className="container py-16">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-primary px-8 py-14 text-primary-foreground">
          <div className="confetti absolute inset-0 opacity-20" aria-hidden />
          <div className="relative mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold md:text-4xl">Tem um buffet ou serviço de eventos?</h2>
            <p className="mx-auto mt-3 max-w-lg text-primary-foreground/80">
              Crie seu perfil, publique seu catálogo e receba pedidos de orçamento de clientes
              prontos para contratar.
            </p>
            <Link
              href="/cadastrar"
              className={cn(buttonVariants({ variant: 'accent', size: 'lg' }), 'mt-6')}
            >
              Anunciar meu negócio <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
