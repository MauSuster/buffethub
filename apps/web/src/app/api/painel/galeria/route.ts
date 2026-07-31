import { randomUUID } from 'node:crypto';

import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const PROVIDER_GALLERY_BUCKET =
  'provider-gallery';

const MAX_IMAGES = 12;
const MAX_IMAGE_SIZE =
  5 * 1024 * 1024;

const ACCEPTED_IMAGE_TYPES =
  new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
  ]);

type GalleryOrderItem = {
  clientId: string;
  persistedId: string | null;
  isNew: boolean;
  position: number;
};

type GalleryDatabaseRow = {
  id: string;
  provider_id: string;
  storage_path: string;
  alt_text: string | null;
  position: number;
  created_at: string;
  updated_at: string;
};

type UploadedImage = {
  clientId: string;
  id: string;
  storagePath: string;
};

function jsonError(
  message: string,
  status: number,
  details?: unknown,
) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      details:
        process.env.NODE_ENV ===
        'development'
          ? details
          : undefined,
    },
    {
      status,
    },
  );
}

function getFileExtension(
  mimeType: string,
): string | null {
  switch (mimeType) {
    case 'image/jpeg':
      return 'jpg';

    case 'image/png':
      return 'png';

    case 'image/webp':
      return 'webp';

    default:
      return null;
  }
}

function parseStringArray(
  value: FormDataEntryValue | null,
): string[] {
  if (
    typeof value !== 'string' ||
    !value.trim()
  ) {
    return [];
  }

  try {
    const parsed: unknown =
      JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return Array.from(
      new Set(
        parsed.filter(
          (
            item,
          ): item is string =>
            typeof item ===
              'string' &&
            item.trim().length > 0,
        ),
      ),
    );
  } catch {
    return [];
  }
}

function parseOrder(
  value: FormDataEntryValue | null,
): GalleryOrderItem[] {
  if (
    typeof value !== 'string' ||
    !value.trim()
  ) {
    return [];
  }

  try {
    const parsed: unknown =
      JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(
        (
          item,
        ): item is Record<
          string,
          unknown
        > =>
          typeof item ===
            'object' &&
          item !== null,
      )
      .map((item) => ({
        clientId:
          typeof item.clientId ===
          'string'
            ? item.clientId
            : '',
        persistedId:
          typeof item.persistedId ===
          'string'
            ? item.persistedId
            : null,
        isNew:
          item.isNew === true,
        position:
          typeof item.position ===
          'number'
            ? item.position
            : -1,
      }))
      .filter(
        (item) =>
          item.clientId.length >
            0 &&
          item.position >= 0,
      );
  } catch {
    return [];
  }
}

function serializeError(
  error: unknown,
): unknown {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return error;
}

async function loadGallery(
  providerId: string,
) {
  const supabase =
    await createClient();

  const { data, error } =
    await supabase
      .from(
        'provider_gallery_images',
      )
      .select('*')
      .eq(
        'provider_id',
        providerId,
      )
      .order('position', {
        ascending: true,
      })
      .order('created_at', {
        ascending: true,
      });

  if (error) {
    throw new Error(
      `Não foi possível carregar a galeria: ${error.message}`,
    );
  }

  return (
    (data ?? []) as GalleryDatabaseRow[]
  ).map((image) => {
    const {
      data: publicUrlData,
    } = supabase.storage
      .from(
        PROVIDER_GALLERY_BUCKET,
      )
      .getPublicUrl(
        image.storage_path,
      );

    return {
      id: image.id,
      storagePath:
        image.storage_path,
      publicUrl:
        publicUrlData.publicUrl,
      position:
        image.position ?? 0,
    };
  });
}

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: authData,
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      return jsonError(
        'Você precisa estar autenticado para carregar a galeria.',
        401,
        authError,
      );
    }

    const {
      data: provider,
      error: providerError,
    } = await supabase
      .from('providers')
      .select('id,slug,owner_id,deleted_at')
      .eq('owner_id', authData.user.id)
      .is('deleted_at', null)
      .maybeSingle();

    if (providerError) {
      return jsonError(
        'Não foi possível localizar seu negócio.',
        500,
        providerError,
      );
    }

    if (!provider) {
      return jsonError(
        'Nenhum negócio foi encontrado para este usuário.',
        404,
      );
    }

    const images = await loadGallery(provider.id);

    return NextResponse.json(
      {
        success: true,
        images,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error(
      '[GET /api/painel/galeria] Erro inesperado:',
      error,
    );

    return jsonError(
      'Ocorreu um erro interno ao carregar a galeria.',
      500,
      serializeError(error),
    );
  }
}

export async function POST(
  request: Request,
) {
  const uploadedStoragePaths: string[] =
    [];

  try {
    const supabase =
      await createClient();

    const {
      data: authData,
      error: authError,
    } =
      await supabase.auth.getUser();

    if (
      authError ||
      !authData.user
    ) {
      return jsonError(
        'Você precisa estar autenticado para alterar a galeria.',
        401,
        authError,
      );
    }

    const {
      data: provider,
      error: providerError,
    } = await supabase
      .from('providers')
      .select(
        'id,slug,owner_id,deleted_at',
      )
      .eq(
        'owner_id',
        authData.user.id,
      )
      .is('deleted_at', null)
      .maybeSingle();

    if (providerError) {
      return jsonError(
        'Não foi possível localizar seu negócio.',
        500,
        providerError,
      );
    }

    if (!provider) {
      return jsonError(
        'Nenhum negócio foi encontrado para este usuário.',
        404,
      );
    }

    const formData =
      await request.formData();

    const deletedIds =
      parseStringArray(
        formData.get(
          'deletedIds',
        ),
      );

    const order = parseOrder(
      formData.get('order'),
    );

    const files =
      formData
        .getAll('images')
        .filter(
          (
            entry,
          ): entry is File =>
            entry instanceof File,
        );

    const imageClientIds =
      formData
        .getAll(
          'imageClientIds',
        )
        .filter(
          (
            entry,
          ): entry is string =>
            typeof entry ===
            'string',
        );

    if (
      files.length !==
      imageClientIds.length
    ) {
      return jsonError(
        'Os arquivos enviados não correspondem à ordem da galeria.',
        400,
        {
          files:
            files.length,
          imageClientIds:
            imageClientIds.length,
        },
      );
    }

    const {
      data: currentImages,
      error:
        currentImagesError,
    } = await supabase
      .from(
        'provider_gallery_images',
      )
      .select(
        'id,provider_id,storage_path,position',
      )
      .eq(
        'provider_id',
        provider.id,
      );

    if (
      currentImagesError
    ) {
      return jsonError(
        'Não foi possível carregar a galeria atual.',
        500,
        currentImagesError,
      );
    }

    const currentRows =
      currentImages ?? [];

    const currentImageIds =
      new Set(
        currentRows.map(
          (image) =>
            image.id,
        ),
      );

    const validDeletedIds =
      deletedIds.filter(
        (imageId) =>
          currentImageIds.has(
            imageId,
          ),
      );

    const remainingCount =
      currentRows.length -
      validDeletedIds.length;

    const finalCount =
      remainingCount +
      files.length;

    if (
      finalCount >
      MAX_IMAGES
    ) {
      return jsonError(
        `Você pode adicionar no máximo ${MAX_IMAGES} imagens.`,
        400,
      );
    }

    for (const file of files) {
      if (
        !ACCEPTED_IMAGE_TYPES.has(
          file.type,
        )
      ) {
        return jsonError(
          `${file.name}: formato inválido. Utilize JPG, PNG ou WebP.`,
          400,
        );
      }

      if (
        file.size <= 0
      ) {
        return jsonError(
          `${file.name}: o arquivo está vazio.`,
          400,
        );
      }

      if (
        file.size >
        MAX_IMAGE_SIZE
      ) {
        return jsonError(
          `${file.name}: a imagem ultrapassa o limite de 5 MB.`,
          400,
        );
      }
    }

    /*
     * Primeiro excluímos os registros marcados.
     * Os IDs são previamente filtrados pelo provider_id.
     */
    if (
      validDeletedIds.length >
      0
    ) {
      const imagesToDelete =
        currentRows.filter(
          (image) =>
            validDeletedIds.includes(
              image.id,
            ),
        );

      const pathsToDelete =
        imagesToDelete.map(
          (image) =>
            image.storage_path,
        );

      if (
        pathsToDelete.length >
        0
      ) {
        const {
          error:
            storageDeleteError,
        } =
          await supabase.storage
            .from(
              PROVIDER_GALLERY_BUCKET,
            )
            .remove(
              pathsToDelete,
            );

        if (
          storageDeleteError
        ) {
          return jsonError(
            'Não foi possível remover uma ou mais imagens do armazenamento.',
            500,
            storageDeleteError,
          );
        }
      }

      const {
        error:
          databaseDeleteError,
      } = await supabase
        .from(
          'provider_gallery_images',
        )
        .delete()
        .eq(
          'provider_id',
          provider.id,
        )
        .in(
          'id',
          validDeletedIds,
        );

      if (
        databaseDeleteError
      ) {
        return jsonError(
          'As imagens foram removidas do armazenamento, mas não foi possível atualizar a galeria.',
          500,
          databaseDeleteError,
        );
      }
    }

    const uploadedImages: UploadedImage[] =
      [];

    for (
      let index = 0;
      index < files.length;
      index += 1
    ) {
      const file =
        files[index];

      const clientId =
        imageClientIds[index];

      if (
        !file ||
        !clientId
      ) {
        continue;
      }

      const extension =
        getFileExtension(
          file.type,
        );

      if (!extension) {
        return jsonError(
          `${file.name}: formato inválido.`,
          400,
        );
      }

      const storagePath =
        `${provider.id}/${randomUUID()}.${extension}`;

      const arrayBuffer =
        await file.arrayBuffer();

      const {
        error: uploadError,
      } =
        await supabase.storage
          .from(
            PROVIDER_GALLERY_BUCKET,
          )
          .upload(
            storagePath,
            arrayBuffer,
            {
              contentType:
                file.type,
              cacheControl:
                '3600',
              upsert: false,
            },
          );

      if (uploadError) {
        if (
          uploadedStoragePaths.length >
          0
        ) {
          await supabase.storage
            .from(
              PROVIDER_GALLERY_BUCKET,
            )
            .remove(
              uploadedStoragePaths,
            );
        }

        return jsonError(
          'Não foi possível enviar uma ou mais imagens.',
          500,
          uploadError,
        );
      }

      uploadedStoragePaths.push(
        storagePath,
      );

      const {
        data: insertedImage,
        error: insertError,
      } = await supabase
        .from(
          'provider_gallery_images',
        )
        .insert({
          provider_id:
            provider.id,
          storage_path:
            storagePath,
          position:
            currentRows.length +
            index,
        })
        .select('id')
        .single();

      if (
        insertError ||
        !insertedImage
      ) {
        await supabase.storage
          .from(
            PROVIDER_GALLERY_BUCKET,
          )
          .remove([
            storagePath,
          ]);

        if (
          uploadedStoragePaths.length >
          0
        ) {
          await supabase.storage
            .from(
              PROVIDER_GALLERY_BUCKET,
            )
            .remove(
              uploadedStoragePaths,
            );
        }

        return jsonError(
          'A imagem foi enviada, mas não foi possível registrá-la na galeria.',
          500,
          insertError,
        );
      }

      uploadedImages.push({
        clientId,
        id:
          insertedImage.id,
        storagePath,
      });
    }

    const uploadedByClientId =
      new Map(
        uploadedImages.map(
          (image) => [
            image.clientId,
            image,
          ],
        ),
      );

    const finalOrderIds =
      order
        .sort(
          (
            firstItem,
            secondItem,
          ) =>
            firstItem.position -
            secondItem.position,
        )
        .map((item) => {
          if (item.isNew) {
            return uploadedByClientId.get(
              item.clientId,
            )?.id;
          }

          return item.persistedId;
        })
        .filter(
          (
            imageId,
          ): imageId is string =>
            Boolean(imageId),
        );

    const uniqueFinalOrderIds =
      Array.from(
        new Set(
          finalOrderIds,
        ),
      );

    for (
      let position = 0;
      position <
      uniqueFinalOrderIds.length;
      position += 1
    ) {
      const imageId =
        uniqueFinalOrderIds[
          position
        ];

      if (!imageId) {
        continue;
      }

      const {
        error:
          updatePositionError,
      } = await supabase
        .from(
          'provider_gallery_images',
        )
        .update({
          position,
        })
        .eq(
          'id',
          imageId,
        )
        .eq(
          'provider_id',
          provider.id,
        );

      if (
        updatePositionError
      ) {
        return jsonError(
          'As imagens foram enviadas, mas não foi possível atualizar a ordem da galeria.',
          500,
          updatePositionError,
        );
      }
    }

    const images =
      await loadGallery(
        provider.id,
      );

    return NextResponse.json(
      {
        success: true,
        message:
          'Galeria salva com sucesso.',
        images,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error(
      '[POST /api/painel/galeria] Erro inesperado:',
      error,
    );

    /*
     * Limpa uploads que foram realizados antes
     * de uma exceção inesperada.
     */
    if (
      uploadedStoragePaths.length >
      0
    ) {
      try {
        const supabase =
          await createClient();

        await supabase.storage
          .from(
            PROVIDER_GALLERY_BUCKET,
          )
          .remove(
            uploadedStoragePaths,
          );
      } catch (
        cleanupError
      ) {
        console.error(
          '[POST /api/painel/galeria] Erro ao limpar uploads:',
          cleanupError,
        );
      }
    }

    return jsonError(
      'Ocorreu um erro interno ao salvar a galeria.',
      500,
      serializeError(error),
    );
  }
}