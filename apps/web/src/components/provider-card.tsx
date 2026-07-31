import Link from 'next/link';
import { BadgeCheck, MapPin, Star } from 'lucide-react';
import type { Tables } from '@buffethub/database';
import { formatBRL } from '@buffethub/utils';
import { Badge } from '@/components/ui/badge';

export function ProviderCard({ provider }: { provider: Tables<'providers'> }) {
  const hasRating = provider.rating_count > 0;
  const location = [provider.city, provider.state].filter(Boolean).join(', ');
  const priceLabel =
    provider.price_range_min_cents != null
      ? `A partir de ${formatBRL(provider.price_range_min_cents)}`
      : 'Sob orçamento';

  return (
    <Link
      href={`/fornecedores/${provider.slug}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-secondary">
        {provider.banner_url ? (
          <img
            src={provider.banner_url}
            alt={provider.trade_name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 via-secondary to-accent/15">
            <span className="font-display text-2xl text-primary/50">{provider.trade_name}</span>
          </div>
        )}
        {provider.verification_status === 'VERIFIED' ? (
          <div className="absolute left-3 top-3">
            <Badge variant="success">
              <BadgeCheck className="h-3.5 w-3.5" /> Verificado
            </Badge>
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-lg font-semibold leading-tight text-foreground">
            {provider.trade_name}
          </h3>
          {hasRating ? (
            <span className="flex shrink-0 items-center gap-1 text-sm font-semibold">
              <Star className="h-4 w-4 fill-accent text-accent" />
              {provider.rating_avg.toFixed(1)}
            </span>
          ) : (
            <span className="shrink-0 text-xs text-muted-foreground">Novo</span>
          )}
        </div>

        {location ? (
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" /> {location}
          </p>
        ) : null}

        <p className="mt-auto pt-1 text-sm font-medium text-primary">{priceLabel}</p>
      </div>
    </Link>
  );
}
