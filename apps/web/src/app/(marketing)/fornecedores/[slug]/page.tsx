import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  BadgeCheck,
  Globe,
  Images,
  Instagram,
  MapPin,
  MessageCircle,
  Star,
  Users,
} from 'lucide-react';

import type { Tables } from '@buffethub/database';
import {
  formatBRL,
  onlyDigits,
  truncate,
} from '@buffethub/utils';

import { CategoryIcon } from '@/components/category-icon';
import { Badge } from '@/components/ui/badge';
import {
  type ProviderGalleryImage,
  getProviderBySlug,
  getProviderCategories,
  getProviderGalleryImages,
  getPublishedServices,
} from '@/lib/data/providers';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Provider = Tables<'providers'>;

type ProviderPageData = {
  provider: Provider;
  services: Tables<'services'>[];
  categories: Tables<'service_categories'>[];
  galleryImages: ProviderGalleryImage[];
};

function servicePrice(
  service: Tables<'services'>,
): string {
  if (
    service.price_type === 'CUSTOM_QUOTE' ||
    service.base_price_cents == null
  ) {
    return 'Sob orçamento';
  }

  const value = formatBRL(service.base_price_cents);

  switch (service.price_type) {
    case 'PER_PERSON':
      return `${value} / pessoa`;

    case 'PER_HOUR':
      return `${value} / hora`;

    case 'PER_DAY':
      return `${value} / dia`;

    case 'STARTING_AT':
      return `A partir de ${value}`;

    default:
      return value;
  }
}

function getWhatsAppNumber(value: string): string | null {
  const digits = onlyDigits(value);

  if (!digits) {
    return null;
  }

  if (digits.startsWith('55')) {
    return digits;
  }

  return `55${digits}`;
}

function normalizeWebsiteUrl(
  value: string | null,
): string | null {
  const website = value?.trim();

  if (!website) {
    return null;
  }

  if (
    website.startsWith('http://') ||
    website.startsWith('https://')
  ) {
    return website;
  }

  return `https://${website}`;
}

function normalizeInstagramHandle(
  value: string | null,
): string | null {
  const handle = value
    ?.trim()
    .replace(
      /^https?:\/\/(www\.)?instagram\.com\//i,
      '',
    )
    .replace(/^@/, '')
    .replace(/\/+$/, '')
    .split(/[/?#]/)[0]
    ?.trim();

  return handle || null;
}

function normalizeGalleryImages(
  providerId: string,
  images: ProviderGalleryImage[],
): ProviderGalleryImage[] {
  const expectedPrefix = `${providerId}/`;
  const usedIds = new Set<string>();

  return images
    .filter((image) => {
      if (!image.id || usedIds.has(image.id)) {
        return false;
      }

      usedIds.add(image.id);

      if (image.providerId !== providerId) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn(
            '[ProviderPage] imagem ignorada por providerId divergente:',
            {
              expectedProviderId: providerId,
              imageProviderId: image.providerId,
              imageId: image.id,
            },
          );
        }

        return false;
      }

      if (!image.storagePath.startsWith(expectedPrefix)) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn(
            '[ProviderPage] imagem ignorada por storagePath divergente:',
            {
              providerId,
              imageId: image.id,
              storagePath: image.storagePath,
              expectedPrefix,
            },
          );
        }

        return false;
      }

      try {
        const url = new URL(image.publicUrl);

        return (
          url.protocol === 'https:' ||
          url.protocol === 'http:'
        );
      } catch {
        return false;
      }
    })
    .sort((firstImage, secondImage) => {
      if (firstImage.position !== secondImage.position) {
        return firstImage.position - secondImage.position;
      }

      const firstDate = firstImage.createdAt
        ? new Date(firstImage.createdAt).getTime()
        : 0;

      const secondDate = secondImage.createdAt
        ? new Date(secondImage.createdAt).getTime()
        : 0;

      return firstDate - secondDate;
    });
}

async function loadProviderPageData(
  slug: string,
): Promise<ProviderPageData | null> {
  const normalizedSlug = slug.trim().toLowerCase();

  if (!normalizedSlug) {
    return null;
  }

  const provider = await getProviderBySlug(normalizedSlug);

  if (!provider) {
    return null;
  }

  const [
    services,
    categories,
    rawGalleryImages,
  ] = await Promise.all([
    getPublishedServices(provider.id),
    getProviderCategories(provider.id),
    getProviderGalleryImages(provider.id),
  ]);

  const galleryImages = normalizeGalleryImages(
    provider.id,
    rawGalleryImages,
  );

  if (process.env.NODE_ENV !== 'production') {
    console.log('[ProviderPage] diagnóstico da galeria:', {
      slug: normalizedSlug,
      providerId: provider.id,
      providerName: provider.trade_name,
      rawGalleryImagesCount: rawGalleryImages.length,
      validGalleryImagesCount: galleryImages.length,
      galleryImages: galleryImages.map((image) => ({
        id: image.id,
        providerId: image.providerId,
        storagePath: image.storagePath,
        publicUrl: image.publicUrl,
        position: image.position,
      })),
    });
  }

  return {
    provider,
    services,
    categories,
    galleryImages,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{
    slug: string;
  }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await loadProviderPageData(slug);

  if (!data) {
    return {
      title: 'Fornecedor não encontrado',
    };
  }

  const {
    provider,
    galleryImages,
  } = data;

  const featuredImage =
    galleryImages[0]?.publicUrl ||
    provider.banner_url ||
    undefined;

  const description = provider.description
    ? truncate(provider.description, 155)
    : `Conheça os serviços de ${provider.trade_name} no BuffetHub.`;

  return {
    title: provider.trade_name,
    description,
    openGraph: {
      title: provider.trade_name,
      description,
      type: 'website',
      images: featuredImage
        ? [
            {
              url: featuredImage,
              alt:
                galleryImages[0]?.altText ||
                `Imagem de ${provider.trade_name}`,
            },
          ]
        : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: provider.trade_name,
      description,
      images: featuredImage
        ? [featuredImage]
        : undefined,
    },
  };
}

export default async function ProviderPage({
  params,
}: {
  params: Promise<{
    slug: string;
  }>;
}) {
  const { slug } = await params;
  const data = await loadProviderPageData(slug);

  if (!data) {
    notFound();
  }

  const {
    provider,
    services,
    categories,
    galleryImages,
  } = data;

  const location = [
    provider.city,
    provider.state,
  ]
    .filter(Boolean)
    .join(', ');

  const capacity =
    provider.min_capacity != null &&
    provider.max_capacity != null
      ? `${provider.min_capacity}–${provider.max_capacity} convidados`
      : provider.max_capacity != null
        ? `Até ${provider.max_capacity} convidados`
        : provider.min_capacity != null
          ? `A partir de ${provider.min_capacity} convidados`
          : null;

  const whatsappNumber = provider.whatsapp
    ? getWhatsAppNumber(provider.whatsapp)
    : null;

  const instagramHandle =
    normalizeInstagramHandle(provider.instagram);

  const website =
    normalizeWebsiteUrl(provider.website);

  return (
    <main className="min-h-screen bg-background">
      <section className="relative h-44 w-full overflow-hidden bg-secondary sm:h-56 md:h-64 lg:h-72">
        {provider.banner_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={provider.banner_url}
            alt={`Banner de ${provider.trade_name}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/15 via-secondary to-accent/20" />
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent" />
      </section>

      <div className="relative z-10 mx-auto -mt-8 w-full max-w-7xl px-4 pb-12 sm:-mt-10 sm:px-6 sm:pb-16 lg:-mt-12 lg:px-8">
        <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0">
            <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
              <div className="p-4 sm:p-6 lg:p-7">
                <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <h1 className="min-w-0 break-words font-display text-2xl font-semibold leading-tight text-foreground sm:text-3xl lg:text-4xl">
                        {provider.trade_name}
                      </h1>

                      {provider.verification_status ===
                      'VERIFIED' ? (
                        <Badge
                          variant="success"
                          className="shrink-0 whitespace-nowrap"
                        >
                          <BadgeCheck className="h-3.5 w-3.5" />
                          Verificado
                        </Badge>
                      ) : null}
                    </div>

                    {location ? (
                      <p className="mt-2 flex min-w-0 items-start gap-1.5 text-sm text-muted-foreground sm:items-center">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 sm:mt-0" />

                        <span className="min-w-0 break-words">
                          {location}
                        </span>
                      </p>
                    ) : null}
                  </div>

                  {provider.rating_count > 0 ? (
                    <div className="flex shrink-0 items-center gap-3 rounded-xl bg-secondary/60 px-3 py-2 sm:block sm:bg-transparent sm:px-0 sm:py-0 sm:text-right">
                      <span className="flex items-center gap-1 text-lg font-semibold text-foreground">
                        <Star className="h-5 w-5 fill-accent text-accent" />

                        {provider.rating_avg.toFixed(1)}
                      </span>

                      <span className="text-xs text-muted-foreground">
                        {provider.rating_count}{' '}
                        {provider.rating_count === 1
                          ? 'avaliação'
                          : 'avaliações'}
                      </span>
                    </div>
                  ) : null}
                </div>

                {categories.length > 0 ? (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <Badge
                        key={category.id}
                        variant="primary"
                        className="max-w-full"
                      >
                        <CategoryIcon
                          slug={category.slug}
                          className="h-3.5 w-3.5 shrink-0"
                        />

                        <span className="truncate">
                          {category.name}
                        </span>
                      </Badge>
                    ))}
                  </div>
                ) : null}

                {provider.description ? (
                  <p className="mt-5 whitespace-pre-line break-words text-sm leading-6 text-foreground/90 sm:text-base sm:leading-7">
                    {provider.description}
                  </p>
                ) : (
                  <p className="mt-5 text-sm text-muted-foreground">
                    Este fornecedor ainda não adicionou uma descrição.
                  </p>
                )}
              </div>
            </section>

            <div className="mt-6 lg:hidden">
              <ContactCard
                capacity={capacity}
                serviceRadiusKm={provider.service_radius_km}
                whatsappNumber={whatsappNumber}
                instagramHandle={instagramHandle}
                website={website}
              />
            </div>

            <section className="mt-8 sm:mt-10">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Images className="h-5 w-5 text-primary" />

                    <h2 className="font-display text-xl font-semibold text-foreground sm:text-2xl">
                      Galeria de fotos
                    </h2>
                  </div>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Conheça alguns trabalhos realizados por{' '}
                    {provider.trade_name}.
                  </p>
                </div>

                {galleryImages.length > 0 ? (
                  <span className="shrink-0 text-sm text-muted-foreground">
                    {galleryImages.length}{' '}
                    {galleryImages.length === 1
                      ? 'imagem'
                      : 'imagens'}
                  </span>
                ) : null}
              </div>

              {galleryImages.length > 0 ? (
                <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3">
                  {galleryImages.map((image, index) => {
                    const isFeatured = index === 0;

                    return (
                      <figure
                        key={image.id}
                        className={[
                          'group relative min-w-0 overflow-hidden rounded-xl border border-border bg-secondary shadow-card',
                          isFeatured
                            ? 'sm:col-span-2 md:row-span-2'
                            : '',
                        ].join(' ')}
                      >
                        <div
                          className={
                            isFeatured
                              ? 'aspect-[16/10] min-h-64 sm:min-h-80 md:h-full md:min-h-[24rem]'
                              : 'aspect-[4/3]'
                          }
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={image.publicUrl}
                            alt={
                              image.altText ||
                              `Foto ${index + 1} da galeria de ${provider.trade_name}`
                            }
                            loading={
                              isFeatured
                                ? 'eager'
                                : 'lazy'
                            }
                            fetchPriority={
                              isFeatured
                                ? 'high'
                                : 'auto'
                            }
                            referrerPolicy="no-referrer"
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>

                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                        {isFeatured ? (
                          <span className="absolute left-3 top-3 rounded-full bg-background/90 px-3 py-1 text-xs font-semibold text-foreground shadow-sm backdrop-blur">
                            Imagem em destaque
                          </span>
                        ) : null}
                      </figure>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-secondary/40 px-5 py-10 text-center sm:px-8">
                  <Images className="mx-auto h-9 w-9 text-muted-foreground/50" />

                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    Este fornecedor ainda não adicionou imagens à galeria.
                  </p>

                  {process.env.NODE_ENV !== 'production' ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Verifique o terminal do Next.js para o diagnóstico
                      da consulta da galeria.
                    </p>
                  ) : null}
                </div>
              )}
            </section>

            <section className="mt-8 sm:mt-10">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h2 className="font-display text-xl font-semibold text-foreground sm:text-2xl">
                    Serviços
                  </h2>

                  {services.length > 0 ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {services.length}{' '}
                      {services.length === 1
                        ? 'serviço disponível'
                        : 'serviços disponíveis'}
                    </p>
                  ) : null}
                </div>
              </div>

              {services.length > 0 ? (
                <div className="grid min-w-0 gap-4 sm:grid-cols-2">
                  {services.map((service) => (
                    <article
                      key={service.id}
                      className="flex min-w-0 flex-col rounded-xl border border-border bg-card p-4 shadow-card transition-shadow hover:shadow-md sm:p-5"
                    >
                      <div className="flex min-w-0 items-start justify-between gap-3">
                        <h3 className="min-w-0 break-words font-semibold leading-snug text-foreground">
                          {service.name}
                        </h3>

                        {service.is_featured ? (
                          <Badge
                            variant="accent"
                            className="shrink-0 whitespace-nowrap"
                          >
                            Destaque
                          </Badge>
                        ) : null}
                      </div>

                      {service.short_description ? (
                        <p className="mt-2 break-words text-sm leading-6 text-muted-foreground">
                          {service.short_description}
                        </p>
                      ) : null}

                      <p className="mt-auto pt-4 break-words font-semibold text-primary">
                        {servicePrice(service)}
                      </p>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-secondary/40 px-5 py-10 text-center text-sm leading-6 text-muted-foreground sm:px-8">
                  Este fornecedor ainda está montando o catálogo de serviços.
                </div>
              )}
            </section>
          </div>

          <aside className="hidden min-w-0 lg:block">
            <div className="sticky top-24">
              <ContactCard
                capacity={capacity}
                serviceRadiusKm={provider.service_radius_km}
                whatsappNumber={whatsappNumber}
                instagramHandle={instagramHandle}
                website={website}
              />
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

interface ContactCardProps {
  capacity: string | null;
  serviceRadiusKm: number | null;
  whatsappNumber: string | null;
  instagramHandle: string | null;
  website: string | null;
}

function ContactCard({
  capacity,
  serviceRadiusKm,
  whatsappNumber,
  instagramHandle,
  website,
}: ContactCardProps) {
  const hasProviderDetails =
    Boolean(capacity) ||
    serviceRadiusKm != null;

  const hasContactLinks =
    Boolean(whatsappNumber) ||
    Boolean(instagramHandle) ||
    Boolean(website);

  return (
    <section className="min-w-0 rounded-2xl border border-border bg-card p-4 shadow-card sm:p-6">
      <h2 className="font-display text-lg font-semibold text-foreground">
        Informações e contato
      </h2>

      {hasProviderDetails ? (
        <div className="mt-4 space-y-3 text-sm">
          {capacity ? (
            <div className="flex min-w-0 items-start gap-2 text-muted-foreground">
              <Users className="mt-0.5 h-4 w-4 shrink-0" />

              <span className="min-w-0 break-words">
                {capacity}
              </span>
            </div>
          ) : null}

          {serviceRadiusKm != null ? (
            <div className="flex min-w-0 items-start gap-2 text-muted-foreground">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />

              <span className="min-w-0 break-words">
                Atende em um raio de até {serviceRadiusKm} km
              </span>
            </div>
          ) : null}
        </div>
      ) : null}

      {hasContactLinks ? (
        <div
          className={
            hasProviderDetails
              ? 'mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-1'
              : 'mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-1'
          }
        >
          {whatsappNumber ? (
            <a
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-w-0 items-center justify-center gap-2 rounded-lg bg-success px-4 py-3 text-sm font-semibold text-success-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <MessageCircle className="h-4 w-4 shrink-0" />

              <span className="truncate">
                Falar no WhatsApp
              </span>
            </a>
          ) : null}

          {instagramHandle ? (
            <a
              href={`https://instagram.com/${encodeURIComponent(
                instagramHandle,
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-w-0 items-center justify-center gap-2 rounded-lg border border-border px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Instagram className="h-4 w-4 shrink-0" />

              <span className="min-w-0 truncate">
                @{instagramHandle}
              </span>
            </a>
          ) : null}

          {website ? (
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-w-0 items-center justify-center gap-2 rounded-lg border border-border px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Globe className="h-4 w-4 shrink-0" />

              <span className="truncate">
                Acessar site oficial
              </span>
            </a>
          ) : null}
        </div>
      ) : (
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          Este fornecedor ainda não disponibilizou canais públicos de contato.
        </p>
      )}
    </section>
  );
}