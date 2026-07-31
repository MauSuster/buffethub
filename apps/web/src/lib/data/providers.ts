import 'server-only';

import type { Tables } from '@buffethub/database';

import { createClient } from '@/lib/supabase/server';

export type ProviderSearchParams = {
  q?: string;
  category?: string;
  city?: string;
  state?: string;
};

export type ProviderGalleryImage = {
  id: string;
  providerId: string;
  storagePath: string;
  publicUrl: string;
  altText: string | null;
  position: number;
  createdAt: string | null;
};

type SupabaseErrorLike = {
  code?: string;
  message?: string;
  details?: string | null;
  hint?: string | null;
};

const PROVIDER_SEARCH_LIMIT = 40;
const DEFAULT_FEATURED_LIMIT = 6;

export const PROVIDER_GALLERY_BUCKET = 'provider-gallery';

function sanitizeSearchTerm(value?: string): string {
  return value?.replace(/[,%()]/g, '').trim() ?? '';
}

function normalizeState(value?: string): string {
  return (
    value
      ?.replace(/[^a-zA-Z]/g, '')
      .trim()
      .toUpperCase() ?? ''
  );
}

function normalizeId(value?: string | null): string {
  return value?.trim() ?? '';
}

function normalizeStoragePath(value?: string | null): string {
  return (
    value
      ?.trim()
      .replace(/^\/+/, '')
      .replace(/\/{2,}/g, '/') ?? ''
  );
}

function logSupabaseError(
  context: string,
  error: SupabaseErrorLike,
): void {
  console.error(context, {
    code: error.code ?? 'UNKNOWN',
    message: error.message ?? 'Erro desconhecido do Supabase.',
    details: error.details ?? null,
    hint: error.hint ?? null,
  });
}

function isMissingGalleryTableError(
  error: SupabaseErrorLike,
): boolean {
  if (
    error.code === 'PGRST205' ||
    error.code === '42P01'
  ) {
    return true;
  }

  const message = error.message?.toLowerCase() ?? '';

  if (!message.includes('provider_gallery_images')) {
    return false;
  }

  return (
    message.includes('could not find the table') ||
    message.includes('schema cache') ||
    message.includes('does not exist') ||
    message.includes('relation')
  );
}

/**
 * Retorna os fornecedores aprovados em destaque.
 */
export async function getFeaturedProviders(
  limit = DEFAULT_FEATURED_LIMIT,
): Promise<Tables<'providers'>[]> {
  try {
    const supabase = await createClient();

    const safeLimit = Number.isFinite(limit)
      ? Math.min(Math.max(Math.trunc(limit), 1), 50)
      : DEFAULT_FEATURED_LIMIT;

    const { data, error } = await supabase
      .from('providers')
      .select('*')
      .eq('status', 'APPROVED')
      .is('deleted_at', null)
      .order('rating_avg', {
        ascending: false,
        nullsFirst: false,
      })
      .order('bookings_count', {
        ascending: false,
        nullsFirst: false,
      })
      .order('trade_name', {
        ascending: true,
      })
      .limit(safeLimit);

    if (error) {
      logSupabaseError(
        'Erro ao carregar fornecedores em destaque:',
        error,
      );

      return [];
    }

    return data ?? [];
  } catch (error) {
    console.error(
      'Erro inesperado ao carregar fornecedores em destaque:',
      error,
    );

    return [];
  }
}

/**
 * Retorna os IDs dos fornecedores vinculados a uma categoria.
 */
async function providerIdsForCategory(
  slug: string,
): Promise<string[]> {
  try {
    const sanitizedSlug = slug.trim().toLowerCase();

    if (!sanitizedSlug) {
      return [];
    }

    const supabase = await createClient();

    const {
      data: serviceCategory,
      error: serviceCategoryError,
    } = await supabase
      .from('service_categories')
      .select('id')
      .eq('slug', sanitizedSlug)
      .eq('is_active', true)
      .maybeSingle();

    if (serviceCategoryError) {
      logSupabaseError(
        'Erro ao localizar categoria de serviço:',
        serviceCategoryError,
      );

      return [];
    }

    if (serviceCategory) {
      const {
        data: services,
        error: servicesError,
      } = await supabase
        .from('services')
        .select('provider_id')
        .eq('category_id', serviceCategory.id)
        .is('deleted_at', null);

      if (servicesError) {
        logSupabaseError(
          'Erro ao localizar fornecedores da categoria de serviço:',
          servicesError,
        );
      } else if (services && services.length > 0) {
        return Array.from(
          new Set(
            services
              .map((row) => row.provider_id)
              .filter(
                (providerId): providerId is string =>
                  Boolean(providerId),
              ),
          ),
        );
      }
    }

    const {
      data: category,
      error: categoryError,
    } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', sanitizedSlug)
      .eq('is_active', true)
      .maybeSingle();

    if (categoryError) {
      logSupabaseError(
        'Erro ao localizar categoria:',
        categoryError,
      );

      return [];
    }

    if (!category) {
      return [];
    }

    const {
      data: links,
      error: linksError,
    } = await supabase
      .from('provider_categories')
      .select('provider_id')
      .eq('category_id', category.id);

    if (linksError) {
      logSupabaseError(
        'Erro ao localizar fornecedores da categoria:',
        linksError,
      );

      return [];
    }

    return Array.from(
      new Set(
        (links ?? [])
          .map((row) => row.provider_id)
          .filter(
            (providerId): providerId is string =>
              Boolean(providerId),
          ),
      ),
    );
  } catch (error) {
    console.error(
      'Erro inesperado ao localizar fornecedores da categoria:',
      error,
    );

    return [];
  }
}

/**
 * Pesquisa fornecedores públicos usando os filtros disponíveis.
 */
export async function searchProviders(
  params: ProviderSearchParams = {},
): Promise<Tables<'providers'>[]> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from('providers')
      .select('*')
      .eq('status', 'APPROVED')
      .is('deleted_at', null);

    const category = params.category?.trim();
    const searchTerm = sanitizeSearchTerm(params.q);
    const city = sanitizeSearchTerm(params.city);
    const state = normalizeState(params.state);

    if (category) {
      const providerIds =
        await providerIdsForCategory(category);

      if (providerIds.length === 0) {
        return [];
      }

      query = query.in('id', providerIds);
    }

    if (searchTerm) {
      query = query.or(
        [
          `trade_name.ilike.%${searchTerm}%`,
          `legal_name.ilike.%${searchTerm}%`,
          `description.ilike.%${searchTerm}%`,
          `city.ilike.%${searchTerm}%`,
        ].join(','),
      );
    }

    if (city) {
      query = query.ilike('city', `%${city}%`);
    }

    if (state) {
      query = query.eq('state', state);
    }

    const { data, error } = await query
      .order('rating_avg', {
        ascending: false,
        nullsFirst: false,
      })
      .order('bookings_count', {
        ascending: false,
        nullsFirst: false,
      })
      .order('trade_name', {
        ascending: true,
      })
      .limit(PROVIDER_SEARCH_LIMIT);

    if (error) {
      logSupabaseError(
        'Erro ao pesquisar fornecedores:',
        error,
      );

      return [];
    }

    return data ?? [];
  } catch (error) {
    console.error(
      'Erro inesperado ao pesquisar fornecedores:',
      error,
    );

    return [];
  }
}

/**
 * Retorna um fornecedor público aprovado pelo slug.
 */
export async function getProviderBySlug(
  slug: string,
): Promise<Tables<'providers'> | null> {
  try {
    const sanitizedSlug = slug.trim().toLowerCase();

    if (!sanitizedSlug) {
      return null;
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('providers')
      .select('*')
      .eq('slug', sanitizedSlug)
      .eq('status', 'APPROVED')
      .is('deleted_at', null)
      .maybeSingle();

    if (error) {
      logSupabaseError(
        'Erro ao carregar fornecedor pelo slug:',
        error,
      );

      return null;
    }

    return data ?? null;
  } catch (error) {
    console.error(
      'Erro inesperado ao carregar fornecedor pelo slug:',
      error,
    );

    return null;
  }
}

/**
 * Retorna somente os serviços publicados do fornecedor.
 */
export async function getPublishedServices(
  providerId: string,
): Promise<Tables<'services'>[]> {
  try {
    const normalizedProviderId = normalizeId(providerId);

    if (!normalizedProviderId) {
      return [];
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('provider_id', normalizedProviderId)
      .eq('status', 'PUBLISHED')
      .is('deleted_at', null)
      .order('is_featured', {
        ascending: false,
      })
      .order('sort_order', {
        ascending: true,
        nullsFirst: false,
      })
      .order('created_at', {
        ascending: false,
      });

    if (error) {
      logSupabaseError(
        'Erro ao carregar serviços publicados:',
        error,
      );

      return [];
    }

    return data ?? [];
  } catch (error) {
    console.error(
      'Erro inesperado ao carregar serviços publicados:',
      error,
    );

    return [];
  }
}

/**
 * Retorna todos os serviços do fornecedor.
 */
export async function getProviderServices(
  providerId: string,
): Promise<Tables<'services'>[]> {
  try {
    const normalizedProviderId = normalizeId(providerId);

    if (!normalizedProviderId) {
      return [];
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('provider_id', normalizedProviderId)
      .is('deleted_at', null)
      .order('is_featured', {
        ascending: false,
      })
      .order('sort_order', {
        ascending: true,
        nullsFirst: false,
      })
      .order('created_at', {
        ascending: false,
      });

    if (error) {
      logSupabaseError(
        'Erro ao carregar serviços do fornecedor:',
        error,
      );

      return [];
    }

    return data ?? [];
  } catch (error) {
    console.error(
      'Erro inesperado ao carregar serviços do fornecedor:',
      error,
    );

    return [];
  }
}

/**
 * Retorna as imagens públicas da galeria do fornecedor.
 *
 * A coluna alt_text não é consultada porque ela não existe
 * atualmente na tipagem/tabela provider_gallery_images.
 */
export async function getProviderGalleryImages(
  providerId: string,
): Promise<ProviderGalleryImage[]> {
  try {
    const normalizedProviderId = normalizeId(providerId);

    if (!normalizedProviderId) {
      return [];
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('provider_gallery_images')
      .select(
        `
          id,
          provider_id,
          storage_path,
          position,
          created_at
        `,
      )
      .eq('provider_id', normalizedProviderId)
      .order('position', {
        ascending: true,
        nullsFirst: false,
      })
      .order('created_at', {
        ascending: true,
        nullsFirst: false,
      });

    if (error) {
      if (isMissingGalleryTableError(error)) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn(
            [
              'A tabela public.provider_gallery_images não está disponível.',
              'A página continuará funcionando com a galeria vazia.',
              'Aplique a migration no mesmo projeto Supabase usado pelo frontend.',
            ].join(' '),
          );
        }

        return [];
      }

      logSupabaseError(
        'Erro ao carregar imagens da galeria do fornecedor:',
        error,
      );

      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    const expectedStoragePrefix =
      `${normalizedProviderId}/`;

    return data
      .map((row): ProviderGalleryImage | null => {
        const rowProviderId = normalizeId(
          row.provider_id,
        );

        const storagePath = normalizeStoragePath(
          row.storage_path,
        );

        if (rowProviderId !== normalizedProviderId) {
          if (process.env.NODE_ENV !== 'production') {
            console.warn(
              '[Galeria] Imagem ignorada por provider_id divergente:',
              {
                imageId: row.id,
                requestedProviderId: normalizedProviderId,
                imageProviderId: rowProviderId,
              },
            );
          }

          return null;
        }

        if (!storagePath) {
          if (process.env.NODE_ENV !== 'production') {
            console.warn(
              '[Galeria] Imagem ignorada por storage_path vazio:',
              {
                imageId: row.id,
                providerId: normalizedProviderId,
              },
            );
          }

          return null;
        }

        if (!storagePath.startsWith(expectedStoragePrefix)) {
          if (process.env.NODE_ENV !== 'production') {
            console.warn(
              '[Galeria] Imagem ignorada porque o caminho não pertence ao fornecedor:',
              {
                imageId: row.id,
                providerId: normalizedProviderId,
                storagePath,
                expectedStoragePrefix,
              },
            );
          }

          return null;
        }

        const { data: publicUrlData } =
          supabase.storage
            .from(PROVIDER_GALLERY_BUCKET)
            .getPublicUrl(storagePath);

        const publicUrl =
          publicUrlData.publicUrl?.trim() ?? '';

        if (!publicUrl) {
          if (process.env.NODE_ENV !== 'production') {
            console.warn(
              '[Galeria] Não foi possível gerar a URL pública:',
              {
                imageId: row.id,
                providerId: normalizedProviderId,
                storagePath,
              },
            );
          }

          return null;
        }

        return {
          id: row.id,
          providerId: rowProviderId,
          storagePath,
          publicUrl,
          altText: null,
          position: row.position ?? 0,
          createdAt: row.created_at ?? null,
        };
      })
      .filter(
        (image): image is ProviderGalleryImage =>
          image !== null,
      )
      .sort((firstImage, secondImage) => {
        if (
          firstImage.position !==
          secondImage.position
        ) {
          return (
            firstImage.position -
            secondImage.position
          );
        }

        const firstCreatedAt =
          firstImage.createdAt
            ? new Date(
                firstImage.createdAt,
              ).getTime()
            : 0;

        const secondCreatedAt =
          secondImage.createdAt
            ? new Date(
                secondImage.createdAt,
              ).getTime()
            : 0;

        return (
          firstCreatedAt -
          secondCreatedAt
        );
      });
  } catch (error) {
    console.error(
      'Erro inesperado ao carregar imagens da galeria do fornecedor:',
      error,
    );

    return [];
  }
}

/**
 * Retorna um serviço específico pertencente ao fornecedor.
 */
export async function getProviderServiceById(
  providerId: string,
  serviceId: string,
): Promise<Tables<'services'> | null> {
  try {
    const normalizedProviderId = normalizeId(providerId);
    const normalizedServiceId = normalizeId(serviceId);

    if (
      !normalizedProviderId ||
      !normalizedServiceId
    ) {
      return null;
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('id', normalizedServiceId)
      .eq('provider_id', normalizedProviderId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) {
      logSupabaseError(
        'Erro ao carregar serviço do fornecedor:',
        error,
      );

      return null;
    }

    return data ?? null;
  } catch (error) {
    console.error(
      'Erro inesperado ao carregar serviço do fornecedor:',
      error,
    );

    return null;
  }
}

/**
 * Retorna as categorias vinculadas aos serviços publicados
 * do fornecedor.
 */
export async function getProviderCategories(
  providerId: string,
): Promise<Tables<'service_categories'>[]> {
  try {
    const normalizedProviderId = normalizeId(providerId);

    if (!normalizedProviderId) {
      return [];
    }

    const supabase = await createClient();

    const {
      data: services,
      error: servicesError,
    } = await supabase
      .from('services')
      .select('category_id')
      .eq('provider_id', normalizedProviderId)
      .eq('status', 'PUBLISHED')
      .is('deleted_at', null);

    if (servicesError) {
      logSupabaseError(
        'Erro ao carregar categorias de serviços do fornecedor:',
        servicesError,
      );

      return [];
    }

    const categoryIds = Array.from(
      new Set(
        (services ?? [])
          .map((row) => row.category_id)
          .filter(
            (categoryId): categoryId is string =>
              Boolean(categoryId),
          ),
      ),
    );

    if (categoryIds.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from('service_categories')
      .select('*')
      .in('id', categoryIds)
      .eq('is_active', true)
      .order('sort_order', {
        ascending: true,
        nullsFirst: false,
      })
      .order('name', {
        ascending: true,
      });

    if (error) {
      logSupabaseError(
        'Erro ao carregar categorias do fornecedor:',
        error,
      );

      return [];
    }

    return data ?? [];
  } catch (error) {
    console.error(
      'Erro inesperado ao carregar categorias do fornecedor:',
      error,
    );

    return [];
  }
}