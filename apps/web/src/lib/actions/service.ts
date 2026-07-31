// apps/web/src/lib/actions/service.ts

'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import {
  getMyProvider,
  getSessionUser,
} from '@/lib/data/session';
import { createClient } from '@/lib/supabase/server';

export type ServiceFormState = {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
};

const PRICE_TYPES = [
  'FIXED',
  'PER_PERSON',
  'PER_HOUR',
  'PER_DAY',
  'STARTING_AT',
  'CUSTOM_QUOTE',
] as const;

const SERVICE_STATUS = ['DRAFT', 'PUBLISHED'] as const;

const MAX_IMAGES = 6;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ACCEPTED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

type PriceType = (typeof PRICE_TYPES)[number];
type ServiceStatus = (typeof SERVICE_STATUS)[number];

type SupabaseErrorLike = {
  message?: string;
  details?: string | null;
  hint?: string | null;
  code?: string;
};

function textValue(
  formData: FormData,
  field: string,
): string {
  const value = formData.get(field);

  return typeof value === 'string' ? value.trim() : '';
}

function isPriceType(value: string): value is PriceType {
  return PRICE_TYPES.includes(value as PriceType);
}

function isServiceStatus(
  value: string,
): value is ServiceStatus {
  return SERVICE_STATUS.includes(value as ServiceStatus);
}

function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

/**
 * Converte valores monetários para centavos.
 *
 * Formatos aceitos:
 * 100.00     -> 10000
 * 100,00     -> 10000
 * 1.250,90   -> 125090
 * 1,250.90   -> 125090
 * 1250.90    -> 125090
 * R$ 100,00  -> 10000
 */
function parsePriceToCents(value: string): number | null {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const sanitizedValue = trimmedValue
    .replace(/\s/g, '')
    .replace(/^R\$/i, '')
    .replace(/[^\d,.-]/g, '');

  if (!sanitizedValue) {
    return null;
  }

  const hasComma = sanitizedValue.includes(',');
  const hasDot = sanitizedValue.includes('.');

  let normalizedValue = sanitizedValue;

  if (hasComma && hasDot) {
    const lastCommaIndex =
      sanitizedValue.lastIndexOf(',');
    const lastDotIndex =
      sanitizedValue.lastIndexOf('.');

    if (lastCommaIndex > lastDotIndex) {
      /*
       * Formato brasileiro:
       * 1.250,90 -> 1250.90
       */
      normalizedValue = sanitizedValue
        .replace(/\./g, '')
        .replace(',', '.');
    } else {
      /*
       * Formato internacional:
       * 1,250.90 -> 1250.90
       */
      normalizedValue = sanitizedValue.replace(/,/g, '');
    }
  } else if (hasComma) {
    /*
     * 100,00 -> 100.00
     */
    const commaOccurrences =
      sanitizedValue.match(/,/g)?.length ?? 0;

    if (commaOccurrences > 1) {
      return null;
    }

    normalizedValue = sanitizedValue.replace(',', '.');
  } else if (hasDot) {
    const dotOccurrences =
      sanitizedValue.match(/\./g)?.length ?? 0;

    if (dotOccurrences > 1) {
      /*
       * 1.250.000 -> 1250000
       */
      normalizedValue = sanitizedValue.replace(/\./g, '');
    } else {
      const decimalPart =
        sanitizedValue.split('.')[1] ?? '';

      /*
       * O formulário envia duas casas decimais:
       * 100.00 -> 100.00
       *
       * Um valor com três dígitos após o ponto é tratado
       * como separador de milhares:
       * 1.250 -> 1250
       */
      if (decimalPart.length === 3) {
        normalizedValue = sanitizedValue.replace('.', '');
      }
    }
  }

  const price = Number(normalizedValue);

  if (!Number.isFinite(price) || price <= 0) {
    return null;
  }

  const priceInCents = Math.round(price * 100);

  if (
    !Number.isSafeInteger(priceInCents) ||
    priceInCents <= 0
  ) {
    return null;
  }

  return priceInCents;
}

function getImageFiles(formData: FormData): File[] {
  return formData
    .getAll('images')
    .filter(
      (value): value is File =>
        value instanceof File && value.size > 0,
    );
}

function validateImages(
  images: File[],
): string[] | undefined {
  const errors: string[] = [];

  if (images.length > MAX_IMAGES) {
    errors.push(
      `Você pode adicionar no máximo ${MAX_IMAGES} imagens.`,
    );

    return errors;
  }

  const invalidTypeImage = images.find(
    (image) => !ACCEPTED_IMAGE_TYPES.has(image.type),
  );

  if (invalidTypeImage) {
    errors.push(
      `A imagem "${invalidTypeImage.name}" possui um formato inválido. Use JPG, PNG ou WebP.`,
    );
  }

  const oversizedImage = images.find(
    (image) => image.size > MAX_IMAGE_SIZE,
  );

  if (oversizedImage) {
    errors.push(
      `A imagem "${oversizedImage.name}" ultrapassa o limite de 5 MB.`,
    );
  }

  return errors.length > 0 ? errors : undefined;
}

function getSupabaseErrorMessage(
  error: SupabaseErrorLike,
): string {
  const parts = [
    error.message,
    error.details,
    error.hint,
    error.code ? `Código: ${error.code}` : null,
  ].filter(
    (value): value is string =>
      typeof value === 'string' && value.length > 0,
  );

  return parts.join(' — ');
}

function getInsertErrorState(
  error: SupabaseErrorLike,
): ServiceFormState {
  const detailedError = getSupabaseErrorMessage(error);

  if (
    error.code === '23502' &&
    error.message?.includes('category_id')
  ) {
    return {
      success: false,
      message: 'Revise os campos destacados.',
      errors: {
        category_id: [
          'Selecione uma categoria para o serviço.',
        ],
      },
    };
  }

  if (
    error.code === '23503' &&
    (
      error.message?.includes('category_id') ||
      error.details?.includes('category_id')
    )
  ) {
    return {
      success: false,
      message: 'Revise os campos destacados.',
      errors: {
        category_id: [
          'A categoria selecionada não existe ou não está mais disponível.',
        ],
      },
    };
  }

  if (error.code === '42501') {
    return {
      success: false,
      message:
        'Você não possui permissão para cadastrar serviços neste negócio.',
    };
  }

  if (error.code === '23505') {
    return {
      success: false,
      message:
        'Já existe um serviço com essas informações. Revise os dados e tente novamente.',
    };
  }

  return {
    success: false,
    message:
      process.env.NODE_ENV === 'development'
        ? `Não foi possível cadastrar o serviço: ${detailedError}`
        : 'Não foi possível cadastrar o serviço. Verifique os dados e tente novamente.',
  };
}

export async function createServiceAction(
  _previousState: ServiceFormState,
  formData: FormData,
): Promise<ServiceFormState> {
  let redirectPath: string | null = null;

  try {
    const user = await getSessionUser();

    if (!user) {
      return {
        success: false,
        message:
          'Sua sessão expirou. Entre novamente para continuar.',
      };
    }

    const provider = await getMyProvider(user.id);

    if (!provider) {
      return {
        success: false,
        message:
          'Cadastre seu negócio antes de adicionar serviços.',
      };
    }

    const categoryId = textValue(
      formData,
      'category_id',
    );

    const name = textValue(formData, 'name');

    const shortDescription = textValue(
      formData,
      'short_description',
    );

    const description = textValue(
      formData,
      'description',
    );

    const rawPriceType = textValue(
      formData,
      'price_type',
    );

    const priceValue = textValue(
      formData,
      'price',
    );

    const rawStatus = textValue(
      formData,
      'status',
    );

    const isFeaturedValue =
      formData.get('is_featured');

    const isFeatured =
      isFeaturedValue === 'on' ||
      isFeaturedValue === 'true' ||
      isFeaturedValue === '1';

    const images = getImageFiles(formData);

    const errors: Record<string, string[]> = {};

    if (!categoryId) {
      errors.category_id = [
        'Selecione uma categoria.',
      ];
    } else if (!isValidUuid(categoryId)) {
      errors.category_id = [
        'Selecione uma categoria válida.',
      ];
    }

    if (name.length < 3) {
      errors.name = [
        'Informe um nome com pelo menos 3 caracteres.',
      ];
    } else if (name.length > 120) {
      errors.name = [
        'O nome deve possuir no máximo 120 caracteres.',
      ];
    }

    if (shortDescription.length > 240) {
      errors.short_description = [
        'A descrição resumida deve possuir no máximo 240 caracteres.',
      ];
    }

    if (!isPriceType(rawPriceType)) {
      errors.price_type = [
        'Selecione um tipo de preço válido.',
      ];
    }

    if (!isServiceStatus(rawStatus)) {
      errors.status = [
        'Selecione um status válido.',
      ];
    }

    const imageErrors = validateImages(images);

    if (imageErrors) {
      errors.images = imageErrors;
    }

    let basePriceCents: number | null = null;

    if (isPriceType(rawPriceType)) {
      if (rawPriceType === 'CUSTOM_QUOTE') {
        basePriceCents = null;
      } else {
        basePriceCents =
          parsePriceToCents(priceValue);

        if (basePriceCents === null) {
          errors.price = [
            'Informe um preço válido e maior que zero.',
          ];
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      return {
        success: false,
        message: 'Revise os campos destacados.',
        errors,
      };
    }

    const priceType = rawPriceType as PriceType;
    const status = rawStatus as ServiceStatus;

    const supabase = await createClient();

    /*
     * Confirma que a categoria existe antes de inserir o serviço.
     *
     * Caso sua tabela possua outro nome, altere
     * "service_categories" abaixo para o nome correto.
     */
    const {
      data: category,
      error: categoryError,
    } = await supabase
      .from('service_categories')
      .select('id')
      .eq('id', categoryId)
      .maybeSingle();

    if (categoryError) {
      console.error(
        '[createServiceAction] Erro ao validar categoria:',
        {
          error: categoryError,
          categoryId,
          providerId: provider.id,
        },
      );

      return {
        success: false,
        message:
          process.env.NODE_ENV === 'development'
            ? `Não foi possível validar a categoria: ${getSupabaseErrorMessage(
                categoryError,
              )}`
            : 'Não foi possível validar a categoria selecionada. Tente novamente.',
      };
    }

    if (!category) {
      return {
        success: false,
        message: 'Revise os campos destacados.',
        errors: {
          category_id: [
            'A categoria selecionada não existe ou não está mais disponível.',
          ],
        },
      };
    }

    const servicePayload = {
      provider_id: provider.id,
      category_id: categoryId,
      name,
      short_description: shortDescription || null,
      description: description || null,
      price_type: priceType,
      base_price_cents:
        priceType === 'CUSTOM_QUOTE'
          ? null
          : basePriceCents,
      status,
      is_featured: isFeatured,
      sort_order: 0,
    };

    const {
      data: createdService,
      error: insertError,
    } = await supabase
      .from('services')
      .insert(servicePayload)
      .select('id')
      .single();

    if (insertError) {
      console.error(
        '[createServiceAction] Erro ao cadastrar serviço:',
        {
          error: insertError,
          userId: user.id,
          providerId: provider.id,
          categoryId,
          payload: servicePayload,
        },
      );

      return getInsertErrorState(insertError);
    }

    if (!createdService?.id) {
      console.error(
        '[createServiceAction] Serviço inserido sem ID retornado.',
        {
          userId: user.id,
          providerId: provider.id,
          categoryId,
          payload: servicePayload,
        },
      );

      return {
        success: false,
        message:
          'O serviço foi processado, mas não foi possível confirmar o cadastro.',
      };
    }

    /*
     * As imagens são validadas, mas ainda não são enviadas ao
     * Supabase Storage porque este arquivo não possui o nome do
     * bucket nem a estrutura da tabela de imagens do serviço.
     */
    if (images.length > 0) {
      console.info(
        '[createServiceAction] Serviço criado com imagens pendentes de upload:',
        {
          serviceId: createdService.id,
          imagesCount: images.length,
          imageNames: images.map((image) => image.name),
        },
      );
    }

    revalidatePath('/painel');

    revalidatePath(
      '/painel/meu-negocio/servicos',
    );

    revalidatePath(
      `/fornecedores/${provider.slug}`,
    );

    redirectPath =
      '/painel/meu-negocio/servicos';
  } catch (error) {
    console.error(
      '[createServiceAction] Erro inesperado:',
      error,
    );

    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Erro desconhecido.';

    return {
      success: false,
      message:
        process.env.NODE_ENV === 'development'
          ? `Erro inesperado ao cadastrar o serviço: ${errorMessage}`
          : 'Ocorreu um erro inesperado ao cadastrar o serviço. Tente novamente.',
    };
  }

  if (redirectPath) {
    redirect(redirectPath);
  }

  return {
    success: true,
    message: 'Serviço cadastrado com sucesso.',
  };
}