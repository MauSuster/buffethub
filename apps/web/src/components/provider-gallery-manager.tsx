'use client';

import {
  type ChangeEvent,
  type DragEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AlertCircle,
  CheckCircle2,
  GripVertical,
  ImagePlus,
  Images,
  LoaderCircle,
  Save,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';

const MAX_IMAGES = 12;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ACCEPTED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

export type ProviderGalleryImage = {
  id: string;
  storagePath: string;
  publicUrl: string;
  position: number;
};

type NewGalleryImage = {
  id: string;
  file: File;
  previewUrl: string;
  position: number;
  isNew: true;
};

type GalleryImage =
  | ProviderGalleryImage
  | NewGalleryImage;

type Feedback =
  | {
      type: 'error';
      message: string;
    }
  | {
      type: 'success';
      message: string;
    }
  | null;

type GalleryApiImage = {
  id: string;
  storagePath: string;
  publicUrl: string;
  position: number;
};

type GalleryApiResponse = {
  success?: boolean;
  message?: string;
  error?: string;
  images?: GalleryApiImage[];
  details?: unknown;
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function createImageId(file: File): string {
  return [
    file.name,
    file.size,
    file.lastModified,
    crypto.randomUUID(),
  ].join('-');
}

function isSameFile(
  firstFile: File,
  secondFile: File,
): boolean {
  return (
    firstFile.name === secondFile.name &&
    firstFile.size === secondFile.size &&
    firstFile.lastModified === secondFile.lastModified
  );
}

function isNewGalleryImage(
  image: GalleryImage,
): image is NewGalleryImage {
  return 'isNew' in image && image.isNew === true;
}

function getImagePreviewUrl(
  image: GalleryImage,
): string {
  return isNewGalleryImage(image)
    ? image.previewUrl
    : image.publicUrl;
}

function createNewImage(
  file: File,
  position: number,
): NewGalleryImage {
  return {
    id: createImageId(file),
    file,
    previewUrl: URL.createObjectURL(file),
    position,
    isNew: true,
  };
}

function normalizePositions(
  images: GalleryImage[],
): GalleryImage[] {
  return images.map((image, index) => ({
    ...image,
    position: index,
  }));
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values));
}

async function readApiResponse(
  response: Response,
): Promise<GalleryApiResponse> {
  const contentType =
    response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    try {
      return (await response.json()) as GalleryApiResponse;
    } catch {
      return {
        error:
          'O servidor retornou uma resposta JSON inválida.',
      };
    }
  }

  try {
    const text = await response.text();

    return {
      error:
        text.trim() ||
        `O servidor retornou o status ${response.status}.`,
    };
  } catch {
    return {
      error:
        `O servidor retornou o status ${response.status}.`,
    };
  }
}

interface ProviderGalleryManagerProps {
  initialImages: ProviderGalleryImage[];
}

export default function ProviderGalleryManager({
  initialImages,
}: ProviderGalleryManagerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const imagesRef = useRef<GalleryImage[]>([]);

  const [images, setImages] = useState<GalleryImage[]>(
    normalizePositions(
      [...initialImages].sort(
        (firstImage, secondImage) =>
          firstImage.position - secondImage.position,
      ),
    ),
  );

  const [deletedIds, setDeletedIds] =
    useState<string[]>([]);

  const [isDragging, setIsDragging] =
    useState(false);

  const [draggedImageId, setDraggedImageId] =
    useState<string | null>(null);

  const [feedback, setFeedback] =
    useState<Feedback>(null);

  const [isSaving, setIsSaving] =
    useState(false);

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    return () => {
      imagesRef.current.forEach((image) => {
        if (isNewGalleryImage(image)) {
          URL.revokeObjectURL(
            image.previewUrl,
          );
        }
      });
    };
  }, []);

  const availableSlots =
    MAX_IMAGES - images.length;

  const hasChanges = useMemo(() => {
    const hasNewImages =
      images.some(isNewGalleryImage);

    const hasDeletedImages =
      deletedIds.length > 0;

    const existingImages =
      images.filter(
        (
          image,
        ): image is ProviderGalleryImage =>
          !isNewGalleryImage(image),
      );

    const initialExistingImages =
      [...initialImages].sort(
        (firstImage, secondImage) =>
          firstImage.position -
          secondImage.position,
      );

    const orderChanged =
      existingImages.length ===
        initialExistingImages.length &&
      existingImages.some(
        (image, index) =>
          image.id !==
          initialExistingImages[index]?.id,
      );

    return (
      hasNewImages ||
      hasDeletedImages ||
      orderChanged
    );
  }, [deletedIds, images, initialImages]);

  function openFilePicker(): void {
    if (isSaving) {
      return;
    }

    inputRef.current?.click();
  }

  function validateFiles(
    files: File[],
  ): {
    validFiles: File[];
    errors: string[];
  } {
    const validFiles: File[] = [];
    const errors: string[] = [];

    if (availableSlots <= 0) {
      return {
        validFiles,
        errors: [
          `Você pode adicionar no máximo ${MAX_IMAGES} imagens.`,
        ],
      };
    }

    for (const file of files) {
      if (
        !ACCEPTED_IMAGE_TYPES.has(
          file.type,
        )
      ) {
        errors.push(
          `${file.name}: formato inválido. Utilize JPG, PNG ou WebP.`,
        );

        continue;
      }

      if (file.size <= 0) {
        errors.push(
          `${file.name}: o arquivo está vazio.`,
        );

        continue;
      }

      if (file.size > MAX_IMAGE_SIZE) {
        errors.push(
          `${file.name}: a imagem ultrapassa o limite de 5 MB.`,
        );

        continue;
      }

      const duplicateInGallery =
        images.some(
          (image) =>
            isNewGalleryImage(image) &&
            isSameFile(
              image.file,
              file,
            ),
        );

      const duplicateInSelection =
        validFiles.some(
          (selectedFile) =>
            isSameFile(
              selectedFile,
              file,
            ),
        );

      if (
        duplicateInGallery ||
        duplicateInSelection
      ) {
        errors.push(
          `${file.name}: esta imagem já foi adicionada.`,
        );

        continue;
      }

      if (
        validFiles.length >=
        availableSlots
      ) {
        errors.push(
          `O limite máximo de ${MAX_IMAGES} imagens foi atingido.`,
        );

        break;
      }

      validFiles.push(file);
    }

    return {
      validFiles,
      errors,
    };
  }

  function addFiles(
    fileList: FileList | File[],
  ): void {
    if (isSaving) {
      return;
    }

    const files = Array.from(fileList);

    if (files.length === 0) {
      return;
    }

    const {
      validFiles,
      errors,
    } = validateFiles(files);

    if (validFiles.length > 0) {
      setImages(
        (currentImages) => {
          const startPosition =
            currentImages.length;

          const newImages =
            validFiles.map(
              (file, index) =>
                createNewImage(
                  file,
                  startPosition +
                    index,
                ),
            );

          return normalizePositions([
            ...currentImages,
            ...newImages,
          ]);
        },
      );
    }

    if (errors.length > 0) {
      setFeedback({
        type: 'error',
        message: errors.join(' '),
      });

      return;
    }

    setFeedback({
      type: 'success',
      message:
        validFiles.length === 1
          ? 'Imagem adicionada à galeria.'
          : `${validFiles.length} imagens adicionadas à galeria.`,
    });
  }

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>,
  ): void {
    if (event.target.files) {
      addFiles(event.target.files);
    }

    event.target.value = '';
  }

  function handleDragEnter(
    event: DragEvent<HTMLDivElement>,
  ): void {
    event.preventDefault();
    event.stopPropagation();

    if (!isSaving) {
      setIsDragging(true);
    }
  }

  function handleDragOver(
    event: DragEvent<HTMLDivElement>,
  ): void {
    event.preventDefault();
    event.stopPropagation();

    if (isSaving) {
      event.dataTransfer.dropEffect =
        'none';

      return;
    }

    event.dataTransfer.dropEffect =
      'copy';

    setIsDragging(true);
  }

  function handleDragLeave(
    event: DragEvent<HTMLDivElement>,
  ): void {
    event.preventDefault();
    event.stopPropagation();

    if (
      event.currentTarget.contains(
        event.relatedTarget as Node,
      )
    ) {
      return;
    }

    setIsDragging(false);
  }

  function handleDrop(
    event: DragEvent<HTMLDivElement>,
  ): void {
    event.preventDefault();
    event.stopPropagation();

    setIsDragging(false);

    if (
      !isSaving &&
      event.dataTransfer.files.length > 0
    ) {
      addFiles(
        event.dataTransfer.files,
      );
    }
  }

  function removeImage(
    imageId: string,
  ): void {
    if (isSaving) {
      return;
    }

    setImages((currentImages) => {
      const imageToRemove =
        currentImages.find(
          (image) =>
            image.id === imageId,
        );

      if (
        imageToRemove &&
        isNewGalleryImage(
          imageToRemove,
        )
      ) {
        URL.revokeObjectURL(
          imageToRemove.previewUrl,
        );
      }

      const remainingImages =
        currentImages.filter(
          (image) =>
            image.id !== imageId,
        );

      return normalizePositions(
        remainingImages,
      );
    });

    const removedImage =
      images.find(
        (image) =>
          image.id === imageId,
      );

    if (
      removedImage &&
      !isNewGalleryImage(
        removedImage,
      )
    ) {
      setDeletedIds(
        (currentIds) =>
          uniqueStrings([
            ...currentIds,
            imageId,
          ]),
      );
    }

    setFeedback({
      type: 'success',
      message:
        'Imagem removida da galeria. Salve para confirmar.',
    });
  }

  function clearGallery(): void {
    if (isSaving) {
      return;
    }

    images.forEach((image) => {
      if (
        isNewGalleryImage(image)
      ) {
        URL.revokeObjectURL(
          image.previewUrl,
        );
      }
    });

    const existingImageIds =
      images
        .filter(
          (
            image,
          ): image is ProviderGalleryImage =>
            !isNewGalleryImage(
              image,
            ),
        )
        .map(
          (image) => image.id,
        );

    setDeletedIds(
      (currentIds) =>
        uniqueStrings([
          ...currentIds,
          ...existingImageIds,
        ]),
    );

    setImages([]);

    setFeedback({
      type: 'success',
      message:
        'Todas as imagens foram removidas. Salve para confirmar.',
    });
  }

  function handleImageDragStart(
    imageId: string,
  ): void {
    if (isSaving) {
      return;
    }

    setDraggedImageId(imageId);
  }

  function handleImageDragEnd(): void {
    setDraggedImageId(null);
  }

  function handleImageDrop(
    targetImageId: string,
  ): void {
    if (
      isSaving ||
      !draggedImageId ||
      draggedImageId ===
        targetImageId
    ) {
      setDraggedImageId(null);
      return;
    }

    setImages((currentImages) => {
      const draggedIndex =
        currentImages.findIndex(
          (image) =>
            image.id ===
            draggedImageId,
        );

      const targetIndex =
        currentImages.findIndex(
          (image) =>
            image.id ===
            targetImageId,
        );

      if (
        draggedIndex === -1 ||
        targetIndex === -1
      ) {
        return currentImages;
      }

      const reorderedImages = [
        ...currentImages,
      ];

      const [draggedImage] =
        reorderedImages.splice(
          draggedIndex,
          1,
        );

      if (!draggedImage) {
        return currentImages;
      }

      reorderedImages.splice(
        targetIndex,
        0,
        draggedImage,
      );

      return normalizePositions(
        reorderedImages,
      );
    });

    setDraggedImageId(null);
  }

  async function handleSaveGallery(): Promise<void> {
    if (isSaving) {
      return;
    }

    if (!hasChanges) {
      setFeedback({
        type: 'error',
        message:
          'Adicione, remova ou reordene imagens antes de salvar.',
      });

      return;
    }

    if (
      images.length >
      MAX_IMAGES
    ) {
      setFeedback({
        type: 'error',
        message:
          `Você pode adicionar no máximo ${MAX_IMAGES} imagens.`,
      });

      return;
    }

    setIsSaving(true);
    setFeedback(null);

    try {
      const formData =
        new FormData();

      formData.append(
        'deletedIds',
        JSON.stringify(
          uniqueStrings(
            deletedIds,
          ),
        ),
      );

      const order = images.map(
        (image, position) => ({
          clientId: image.id,
          persistedId:
            isNewGalleryImage(image)
              ? null
              : image.id,
          isNew:
            isNewGalleryImage(image),
          position,
        }),
      );

      formData.append(
        'order',
        JSON.stringify(order),
      );

      images.forEach(
        (image) => {
          if (
            isNewGalleryImage(
              image,
            )
          ) {
            /*
             * Todos os arquivos usam a mesma chave.
             * No servidor:
             *
             * formData.getAll('images')
             */
            formData.append(
              'images',
              image.file,
              image.file.name,
            );

            /*
             * Mantém a relação entre o arquivo
             * e o ID temporário do cliente.
             */
            formData.append(
              'imageClientIds',
              image.id,
            );
          }
        },
      );

      const response = await fetch(
        '/api/painel/galeria',
        {
          method: 'POST',
          body: formData,
          cache: 'no-store',
        },
      );

      const payload =
        await readApiResponse(
          response,
        );

      if (!response.ok) {
        throw new Error(
          payload.error ??
            payload.message ??
            `Não foi possível salvar a galeria. Código ${response.status}.`,
        );
      }

      if (
        !Array.isArray(
          payload.images,
        )
      ) {
        throw new Error(
          'O servidor não retornou a galeria atualizada.',
        );
      }

      const refreshedImages =
        payload.images
          .filter(
            (
              image,
            ): image is GalleryApiImage =>
              Boolean(
                image &&
                  typeof image.id ===
                    'string' &&
                  typeof image.storagePath ===
                    'string' &&
                  typeof image.publicUrl ===
                    'string' &&
                  typeof image.position ===
                    'number',
              ),
          )
          .sort(
            (
              firstImage,
              secondImage,
            ) =>
              firstImage.position -
              secondImage.position,
          );

      images.forEach((image) => {
        if (
          isNewGalleryImage(image)
        ) {
          URL.revokeObjectURL(
            image.previewUrl,
          );
        }
      });

      setImages(
        refreshedImages,
      );

      setDeletedIds([]);

      setFeedback({
        type: 'success',
        message:
          payload.message ??
          'Galeria salva com sucesso.',
      });
    } catch (error) {
      console.error(
        '[ProviderGalleryManager] erro ao salvar galeria:',
        error,
      );

      setFeedback({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Não foi possível salvar a galeria. Tente novamente.',
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
            <Images
              aria-hidden="true"
              className="h-4 w-4"
            />

            Galeria do negócio
          </div>

          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Mostre seus melhores trabalhos
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Adicione fotos dos seus eventos, pratos, espaços,
            decorações e serviços. Arraste as imagens para alterar
            a ordem em que aparecerão no seu perfil.
          </p>
        </div>

        <div className="flex shrink-0 items-center rounded-full border bg-card px-3 py-1.5 text-sm font-medium">
          {images.length}/{MAX_IMAGES}{' '}
          imagens
        </div>
      </header>

      {feedback ? (
        <div
          role={
            feedback.type === 'error'
              ? 'alert'
              : 'status'
          }
          className={[
            'flex items-start gap-3 rounded-lg border px-4 py-3 text-sm',
            feedback.type ===
            'error'
              ? 'border-destructive/30 bg-destructive/5 text-destructive'
              : 'border-emerald-500/30 bg-emerald-500/5 text-emerald-700',
          ].join(' ')}
        >
          {feedback.type ===
          'error' ? (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          )}

          <span className="flex-1">
            {feedback.message}
          </span>

          <button
            type="button"
            onClick={() =>
              setFeedback(null)
            }
            aria-label="Fechar mensagem"
            className="rounded-sm opacity-70 transition-opacity hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      <section className="rounded-xl border bg-card p-4 shadow-sm sm:p-6">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={isSaving}
          onChange={
            handleFileChange
          }
          className="sr-only"
        />

        <div
          role="button"
          tabIndex={
            isSaving ? -1 : 0
          }
          aria-disabled={
            isSaving
          }
          onClick={
            openFilePicker
          }
          onKeyDown={(
            event,
          ) => {
            if (
              !isSaving &&
              (
                event.key ===
                  'Enter' ||
                event.key === ' '
              )
            ) {
              event.preventDefault();
              openFilePicker();
            }
          }}
          onDragEnter={
            handleDragEnter
          }
          onDragOver={
            handleDragOver
          }
          onDragLeave={
            handleDragLeave
          }
          onDrop={handleDrop}
          className={[
            'group flex min-h-64 flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors',
            isSaving
              ? 'cursor-not-allowed opacity-60'
              : 'cursor-pointer',
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/60 hover:bg-secondary/40',
          ].join(' ')}
        >
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform group-hover:scale-105">
            {isSaving ? (
              <LoaderCircle
                aria-hidden="true"
                className="h-7 w-7 animate-spin"
              />
            ) : (
              <UploadCloud
                aria-hidden="true"
                className="h-7 w-7"
              />
            )}
          </div>

          <h2 className="text-base font-semibold sm:text-lg">
            Arraste suas imagens
            para cá
          </h2>

          <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            Ou clique para selecionar
            arquivos do seu
            dispositivo. Você pode
            enviar imagens JPG, PNG ou
            WebP de até 5 MB.
          </p>

          <span className="mt-5 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm">
            <ImagePlus className="h-4 w-4" />
            Selecionar imagens
          </span>
        </div>
      </section>

      {images.length > 0 ? (
        <section className="space-y-4">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-semibold">
                Imagens selecionadas
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                A primeira imagem será
                usada como destaque da
                galeria.
              </p>
            </div>

            <button
              type="button"
              disabled={isSaving}
              onClick={clearGallery}
              className="inline-flex items-center justify-center gap-2 self-start rounded-md border border-destructive/30 px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
            >
              <Trash2 className="h-4 w-4" />

              Limpar galeria
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {images.map(
              (image, index) => (
                <article
                  key={image.id}
                  draggable={
                    !isSaving
                  }
                  onDragStart={() =>
                    handleImageDragStart(
                      image.id,
                    )
                  }
                  onDragEnd={
                    handleImageDragEnd
                  }
                  onDragOver={(
                    event,
                  ) => {
                    event.preventDefault();

                    event.dataTransfer.dropEffect =
                      isSaving
                        ? 'none'
                        : 'move';
                  }}
                  onDrop={(
                    event,
                  ) => {
                    event.preventDefault();

                    handleImageDrop(
                      image.id,
                    );
                  }}
                  className={[
                    'group relative overflow-hidden rounded-xl border bg-card shadow-sm transition',
                    draggedImageId ===
                    image.id
                      ? 'scale-[0.98] opacity-50'
                      : 'hover:-translate-y-0.5 hover:shadow-md',
                  ].join(' ')}
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getImagePreviewUrl(
                        image,
                      )}
                      alt={`Pré-visualização da imagem ${index + 1}`}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    />

                    <div className="absolute inset-x-0 top-0 flex items-start justify-between bg-gradient-to-b from-black/60 to-transparent p-3">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-black/60 px-2 text-xs font-semibold text-white backdrop-blur-sm">
                          {index + 1}
                        </span>

                        {index ===
                        0 ? (
                          <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground shadow-sm">
                            Destaque
                          </span>
                        ) : null}
                      </div>

                      <button
                        type="button"
                        disabled={
                          isSaving
                        }
                        onClick={() =>
                          removeImage(
                            image.id,
                          )
                        }
                        aria-label={`Remover imagem ${index + 1}`}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-destructive disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-black/60 px-2.5 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
                      <GripVertical className="h-3.5 w-3.5" />

                      Arraste para
                      ordenar
                    </div>
                  </div>

                  <div className="p-4">
                    <p
                      className="truncate text-sm font-semibold"
                      title={
                        isNewGalleryImage(
                          image,
                        )
                          ? image.file
                              .name
                          : image.storagePath
                      }
                    >
                      {isNewGalleryImage(
                        image,
                      )
                        ? image.file
                            .name
                        : image.storagePath}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {isNewGalleryImage(
                        image,
                      )
                        ? formatFileSize(
                            image.file
                              .size,
                          )
                        : 'Imagem salva'}
                    </p>
                  </div>
                </article>
              ),
            )}

            {images.length <
            MAX_IMAGES ? (
              <button
                type="button"
                disabled={
                  isSaving
                }
                onClick={
                  openFilePicker
                }
                className="flex min-h-64 flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center text-muted-foreground transition-colors hover:border-primary/60 hover:bg-primary/5 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ImagePlus className="mb-3 h-8 w-8" />

                <span className="font-semibold">
                  Adicionar mais imagens
                </span>

                <span className="mt-1 text-xs">
                  Restam{' '}
                  {MAX_IMAGES -
                    images.length}{' '}
                  espaços
                </span>
              </button>
            ) : null}
          </div>
        </section>
      ) : (
        <section className="rounded-xl border bg-card p-8 text-center shadow-sm">
          <Images className="mx-auto h-10 w-10 text-muted-foreground/60" />

          <h2 className="mt-4 font-semibold">
            Sua galeria ainda está
            vazia
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            Adicione imagens para
            tornar o perfil do seu
            negócio mais atrativo e
            ajudar os clientes a
            conhecerem seu trabalho.
          </p>
        </section>
      )}

      <footer className="sticky bottom-4 z-20 flex flex-col-reverse justify-between gap-3 rounded-xl border bg-background/95 p-4 shadow-lg backdrop-blur sm:flex-row sm:items-center">
        <p className="text-sm text-muted-foreground">
          {isSaving
            ? 'Enviando e atualizando a galeria...'
            : hasChanges
              ? 'Existem alterações pendentes.'
              : images.length === 0
                ? 'Sua galeria está vazia.'
                : `${images.length} ${
                    images.length ===
                    1
                      ? 'imagem salva'
                      : 'imagens salvas'
                  }.`}
        </p>

        <button
          type="button"
          onClick={
            handleSaveGallery
          }
          disabled={
            isSaving ||
            !hasChanges
          }
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}

          {isSaving
            ? 'Salvando...'
            : 'Salvar galeria'}
        </button>
      </footer>
    </div>
  );
}