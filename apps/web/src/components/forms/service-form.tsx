// apps/web/src/components/forms/service-form.tsx

'use client';

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type DragEvent,
  type KeyboardEvent,
  type MouseEvent,
} from 'react';
import Link from 'next/link';
import {
  CircleDollarSign,
  FileText,
  ImageIcon,
  Images,
  Layers3,
  LoaderCircle,
  PackagePlus,
  Save,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';

import { createServiceAction, type ServiceFormState } from '@/lib/actions/service';

const MAX_IMAGES = 6;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_PRICE_IN_CENTS = 999_999_999_99;

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

const initialState: ServiceFormState = {
  success: false,
  message: '',
};

const priceTypeOptions = [
  {
    value: 'FIXED',
    label: 'Preço fixo',
  },
  {
    value: 'STARTING_AT',
    label: 'A partir de',
  },
  {
    value: 'PER_PERSON',
    label: 'Por pessoa',
  },
  {
    value: 'PER_HOUR',
    label: 'Por hora',
  },
  {
    value: 'PER_DAY',
    label: 'Por dia',
  },
  {
    value: 'CUSTOM_QUOTE',
    label: 'Sob orçamento',
  },
] as const;

export type ServiceCategory = {
  id: string;
  name: string;
};

type ServiceFormProps = {
  categories?: readonly ServiceCategory[];
};

type ImagePreview = {
  id: string;
  file: File;
  url: string;
};

function createImageId(file: File): string {
  const randomId =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);

  return [file.name, file.size, file.lastModified, randomId].join('-');
}

function formatFileSize(bytes: number): string {
  const megabytes = bytes / 1024 / 1024;

  return `${megabytes.toFixed(megabytes >= 1 ? 1 : 2)} MB`;
}

function isAcceptedImageType(file: File): file is File & {
  type: (typeof ACCEPTED_IMAGE_TYPES)[number];
} {
  return ACCEPTED_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number]);
}

function isSameFile(firstFile: File, secondFile: File): boolean {
  return (
    firstFile.name === secondFile.name &&
    firstFile.size === secondFile.size &&
    firstFile.lastModified === secondFile.lastModified
  );
}

/**
 * Transforma os números digitados em moeda brasileira.
 *
 * Exemplos:
 * 1       -> R$ 0,01
 * 1234    -> R$ 12,34
 * 125090  -> R$ 1.250,90
 */
function formatCurrencyFromDigits(value: string): string {
  const digits = value.replace(/\D/g, '');

  if (!digits) {
    return '';
  }

  const parsedCents = Number.parseInt(digits, 10);

  if (!Number.isFinite(parsedCents)) {
    return '';
  }

  const cents = Math.min(parsedCents, MAX_PRICE_IN_CENTS);

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

/**
 * Converte a moeda formatada para o formato enviado ao servidor.
 *
 * Exemplo:
 * R$ 1.250,90 -> 1250.90
 */
function currencyToServerValue(value: string): string {
  const digits = value.replace(/\D/g, '');

  if (!digits) {
    return '';
  }

  const cents = Number.parseInt(digits, 10);

  if (!Number.isFinite(cents)) {
    return '';
  }

  return (cents / 100).toFixed(2);
}

function hasFormErrors(errors: ServiceFormState['errors']): boolean {
  if (!errors) {
    return false;
  }

  return Object.values(errors).some((error) => Array.isArray(error) && error.length > 0);
}

export function ServiceForm({ categories = [] }: ServiceFormProps) {
  const [state, formAction, pending] = useActionState(createServiceAction, initialState);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imagePreviewsRef = useRef<ImagePreview[]>([]);
  const dragDepthRef = useRef(0);

  const [categoryId, setCategoryId] = useState('');
  const [priceType, setPriceType] = useState('FIXED');
  const [priceDisplay, setPriceDisplay] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isDraggingImages, setIsDraggingImages] = useState(false);

  const hasCategories = categories.length > 0;
  const isCustomQuote = priceType === 'CUSTOM_QUOTE';

  const hasReachedImageLimit = imagePreviews.length >= MAX_IMAGES;

  const priceServerValue = isCustomQuote ? '' : currencyToServerValue(priceDisplay);

  const serverHasErrors = hasFormErrors(state.errors);

  const isSubmitDisabled = pending || !hasCategories;

  useEffect(() => {
    imagePreviewsRef.current = imagePreviews;
  }, [imagePreviews]);

  useEffect(() => {
    return () => {
      imagePreviewsRef.current.forEach((image) => {
        URL.revokeObjectURL(image.url);
      });
    };
  }, []);

  useEffect(() => {
    if (isCustomQuote) {
      setPriceDisplay('');
    }
  }, [isCustomQuote]);

  function synchronizeFileInput(images: ImagePreview[]) {
    if (!fileInputRef.current) {
      return;
    }

    try {
      const dataTransfer = new DataTransfer();

      images.forEach((image) => {
        dataTransfer.items.add(image.file);
      });

      fileInputRef.current.files = dataTransfer.files;
    } catch {
      setImageError(
        'Não foi possível sincronizar as imagens neste navegador. Tente selecioná-las novamente.',
      );
    }
  }

  function addImages(selectedFiles: File[]) {
    if (pending || selectedFiles.length === 0) {
      return;
    }

    setImageError(null);

    if (hasReachedImageLimit) {
      setImageError(`Você pode adicionar no máximo ${MAX_IMAGES} imagens.`);
      return;
    }

    const invalidNonImageFile = selectedFiles.find((file) => !file.type.startsWith('image/'));

    if (invalidNonImageFile) {
      setImageError(`O arquivo "${invalidNonImageFile.name}" não é uma imagem válida.`);

      synchronizeFileInput(imagePreviews);
      return;
    }

    const invalidTypeFile = selectedFiles.find((file) => !isAcceptedImageType(file));

    if (invalidTypeFile) {
      setImageError(
        `O arquivo "${invalidTypeFile.name}" não possui um formato permitido. Use JPG, PNG ou WebP.`,
      );

      synchronizeFileInput(imagePreviews);
      return;
    }

    const oversizedFile = selectedFiles.find((file) => file.size > MAX_IMAGE_SIZE);

    if (oversizedFile) {
      setImageError(
        `A imagem "${oversizedFile.name}" possui ${formatFileSize(
          oversizedFile.size,
        )}. O limite é de 5 MB por imagem.`,
      );

      synchronizeFileInput(imagePreviews);
      return;
    }

    const availableSlots = MAX_IMAGES - imagePreviews.length;

    const uniqueSelectedFiles = selectedFiles.filter((newFile, index, files) => {
      const alreadySelected = imagePreviews.some((currentImage) =>
        isSameFile(currentImage.file, newFile),
      );

      const repeatedInCurrentSelection = files
        .slice(0, index)
        .some((previousFile) => isSameFile(previousFile, newFile));

      return !alreadySelected && !repeatedInCurrentSelection;
    });

    const duplicatedFilesCount = selectedFiles.length - uniqueSelectedFiles.length;

    const filesToAdd = uniqueSelectedFiles.slice(0, availableSlots);

    if (filesToAdd.length === 0) {
      setImageError(
        duplicatedFilesCount > 0
          ? 'As imagens selecionadas já foram adicionadas.'
          : 'Nenhuma imagem pôde ser adicionada.',
      );

      synchronizeFileInput(imagePreviews);
      return;
    }

    const newImages: ImagePreview[] = filesToAdd.map((file) => ({
      id: createImageId(file),
      file,
      url: URL.createObjectURL(file),
    }));

    const nextImages = [...imagePreviews, ...newImages];

    setImagePreviews(nextImages);
    synchronizeFileInput(nextImages);

    if (uniqueSelectedFiles.length > availableSlots) {
      setImageError(
        `${filesToAdd.length} ${
          filesToAdd.length === 1 ? 'imagem foi adicionada' : 'imagens foram adicionadas'
        }. O limite total é de ${MAX_IMAGES} imagens.`,
      );

      return;
    }

    if (duplicatedFilesCount > 0) {
      setImageError(
        duplicatedFilesCount === 1
          ? 'Uma imagem não foi adicionada porque já estava selecionada.'
          : `${duplicatedFilesCount} imagens não foram adicionadas porque já estavam selecionadas.`,
      );
    }
  }

  function openFilePicker() {
    if (pending) {
      return;
    }

    if (hasReachedImageLimit) {
      setImageError(`Você pode adicionar no máximo ${MAX_IMAGES} imagens.`);
      return;
    }

    fileInputRef.current?.click();
  }

  function handleUploadAreaClick(event: MouseEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;

    if (target.closest('button')) {
      return;
    }

    openFilePicker();
  }

  function handleImagesChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files ?? []);

    addImages(selectedFiles);
  }

  function handlePriceChange(event: ChangeEvent<HTMLInputElement>) {
    const formattedPrice = formatCurrencyFromDigits(event.target.value);

    setPriceDisplay(formattedPrice);
  }

  function handlePriceTypeChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextPriceType = event.target.value;

    setPriceType(nextPriceType);

    if (nextPriceType === 'CUSTOM_QUOTE') {
      setPriceDisplay('');
    }
  }

  function handleDragEnter(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();

    if (pending || hasReachedImageLimit) {
      return;
    }

    dragDepthRef.current += 1;
    setIsDraggingImages(true);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();

    if (pending || hasReachedImageLimit) {
      event.dataTransfer.dropEffect = 'none';
      return;
    }

    event.dataTransfer.dropEffect = 'copy';
    setIsDraggingImages(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();

    dragDepthRef.current = Math.max(dragDepthRef.current - 1, 0);

    if (dragDepthRef.current === 0) {
      setIsDraggingImages(false);
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();

    dragDepthRef.current = 0;
    setIsDraggingImages(false);

    if (pending) {
      return;
    }

    if (hasReachedImageLimit) {
      setImageError(`Você pode adicionar no máximo ${MAX_IMAGES} imagens.`);
      return;
    }

    const droppedFiles = Array.from(event.dataTransfer.files ?? []);

    addImages(droppedFiles);
  }

  function handlePaste(event: ClipboardEvent<HTMLDivElement>) {
    if (pending) {
      return;
    }

    if (hasReachedImageLimit) {
      setImageError(`Você pode adicionar no máximo ${MAX_IMAGES} imagens.`);
      return;
    }

    const clipboardFiles = Array.from(event.clipboardData.files ?? []);

    const pastedImages = clipboardFiles.filter((file) => file.type.startsWith('image/'));

    if (pastedImages.length === 0) {
      return;
    }

    event.preventDefault();
    addImages(pastedImages);
  }

  function handleUploadAreaKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (pending) {
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openFilePicker();
    }
  }

  function removeImage(imageId: string) {
    const imageToRemove = imagePreviews.find((image) => image.id === imageId);

    if (imageToRemove) {
      URL.revokeObjectURL(imageToRemove.url);
    }

    const nextImages = imagePreviews.filter((image) => image.id !== imageId);

    setImagePreviews(nextImages);
    synchronizeFileInput(nextImages);
    setImageError(null);

    if (nextImages.length === 0 && fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function clearImages() {
    imagePreviews.forEach((image) => {
      URL.revokeObjectURL(image.url);
    });

    setImagePreviews([]);
    setImageError(null);
    setIsDraggingImages(false);
    dragDepthRef.current = 0;

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  return (
    <form action={formAction} className="space-y-6">
      {state.message ? (
        <div
          role="alert"
          className={
            state.success
              ? 'rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm text-success'
              : 'rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive'
          }
        >
          {state.message}
        </div>
      ) : null}

      {!state.message && serverHasErrors ? (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          Não foi possível cadastrar o produto ou serviço. Revise os campos destacados abaixo.
        </div>
      ) : null}

      {!hasCategories ? (
        <div
          role="alert"
          className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400"
        >
          <div>
            Nenhuma categoria de serviço está disponível. Cadastre pelo menos uma categoria antes de
            adicionar um produto ou serviço.
          </div>

          <div className="mt-3">
            <Link
              href="/categorias"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Cadastrar categoria
            </Link>
          </div>
        </div>
      ) : null}

      {/* Informações principais */}
      <section className="rounded-xl border border-border bg-card p-4 shadow-card sm:p-6">
        <div className="flex items-start gap-3">
          <div className="shrink-0 rounded-lg bg-primary/10 p-2">
            <PackagePlus className="h-5 w-5 text-primary" />
          </div>

          <div className="min-w-0">
            <h2 className="font-display text-lg font-semibold">Informações do serviço</h2>

            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Informe como este produto ou serviço será apresentado aos clientes.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-5">
          {/* Categoria */}
          <div>
            <label htmlFor="category_id" className="text-sm font-medium text-foreground">
              Categoria
              <span className="ml-1 text-destructive">*</span>
            </label>

            <div className="relative mt-2">
              <Layers3 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <select
                id="category_id"
                name="category_id"
                required
                disabled={pending || !hasCategories}
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                aria-invalid={Boolean(state.errors?.category_id)}
                aria-describedby={
                  state.errors?.category_id ? 'category-id-error' : 'category-id-help'
                }
                className="flex h-11 w-full appearance-none rounded-md border border-input bg-background py-2 pl-10 pr-10 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-secondary disabled:opacity-60"
              >
                <option value="" disabled>
                  {hasCategories ? 'Selecione uma categoria' : 'Nenhuma categoria disponível'}
                </option>

                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              >
                <path
                  fillRule="evenodd"
                  d="M5.22 7.22a.75.75 0 0 1 1.06 0L10 10.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 8.28a.75.75 0 0 1 0-1.06Z"
                  clipRule="evenodd"
                />
              </svg>
            </div>

            {state.errors?.category_id ? (
              <p id="category-id-error" className="mt-1.5 text-sm text-destructive">
                {state.errors.category_id[0]}
              </p>
            ) : (
              <p id="category-id-help" className="mt-1.5 text-xs text-muted-foreground">
                Escolha a categoria que melhor representa o produto ou serviço.
              </p>
            )}
          </div>

          {/* Nome */}
          <div>
            <label htmlFor="name" className="text-sm font-medium text-foreground">
              Nome do produto ou serviço
              <span className="ml-1 text-destructive">*</span>
            </label>

            <input
              id="name"
              name="name"
              type="text"
              required
              minLength={3}
              maxLength={120}
              disabled={pending}
              placeholder="Ex.: Buffet completo para casamento"
              aria-invalid={Boolean(state.errors?.name)}
              aria-describedby={state.errors?.name ? 'name-error' : undefined}
              className="mt-2 flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
            />

            {state.errors?.name ? (
              <p id="name-error" className="mt-1.5 text-sm text-destructive">
                {state.errors.name[0]}
              </p>
            ) : null}
          </div>

          {/* Descrição resumida */}
          <div>
            <div className="flex items-center justify-between gap-4">
              <label htmlFor="short_description" className="text-sm font-medium text-foreground">
                Descrição resumida
              </label>

              <span
                className={
                  shortDescription.length >= 220
                    ? 'text-xs font-medium text-amber-600'
                    : 'text-xs text-muted-foreground'
                }
              >
                {shortDescription.length}/240
              </span>
            </div>

            <textarea
              id="short_description"
              name="short_description"
              rows={3}
              maxLength={240}
              disabled={pending}
              value={shortDescription}
              onChange={(event) => setShortDescription(event.target.value)}
              placeholder="Uma descrição curta que aparecerá no card do serviço."
              aria-invalid={Boolean(state.errors?.short_description)}
              aria-describedby={
                state.errors?.short_description ? 'short-description-error' : undefined
              }
              className="mt-2 flex min-h-24 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
            />

            {state.errors?.short_description ? (
              <p id="short-description-error" className="mt-1.5 text-sm text-destructive">
                {state.errors.short_description[0]}
              </p>
            ) : null}
          </div>

          {/* Descrição completa */}
          <div>
            <label htmlFor="description" className="text-sm font-medium text-foreground">
              Descrição completa
            </label>

            <textarea
              id="description"
              name="description"
              rows={6}
              disabled={pending}
              placeholder="Descreva o que está incluso, diferenciais, duração, quantidade de convidados e outras informações importantes."
              aria-invalid={Boolean(state.errors?.description)}
              aria-describedby={state.errors?.description ? 'description-error' : undefined}
              className="mt-2 flex min-h-36 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
            />

            {state.errors?.description ? (
              <p id="description-error" className="mt-1.5 text-sm text-destructive">
                {state.errors.description[0]}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      {/* Imagens */}
      <section className="rounded-xl border border-border bg-card p-4 shadow-card sm:p-6">
        <div className="flex items-start gap-3">
          <div className="shrink-0 rounded-lg bg-primary/10 p-2">
            <ImageIcon className="h-5 w-5 text-primary" />
          </div>

          <div className="min-w-0">
            <h2 className="font-display text-lg font-semibold">Fotos do serviço</h2>

            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Adicione até {MAX_IMAGES} imagens. A primeira imagem será utilizada como capa do
              serviço.
            </p>
          </div>
        </div>

        <div className="mt-6">
          <div
            role="button"
            tabIndex={pending ? -1 : 0}
            aria-disabled={pending || hasReachedImageLimit}
            onClick={handleUploadAreaClick}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onPaste={handlePaste}
            onKeyDown={handleUploadAreaKeyDown}
            className={[
              'relative flex flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed px-5 py-8 text-center outline-none transition-all',
              pending || hasReachedImageLimit
                ? 'cursor-not-allowed border-border bg-secondary/30 opacity-60'
                : 'cursor-pointer border-border bg-secondary/20 hover:border-primary/60 hover:bg-primary/5 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20',
              isDraggingImages && !pending && !hasReachedImageLimit
                ? 'scale-[1.01] border-primary bg-primary/10 shadow-sm'
                : '',
            ].join(' ')}
          >
            {isDraggingImages && !pending && !hasReachedImageLimit ? (
              <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-primary/10 backdrop-blur-[1px]">
                <div className="rounded-xl border border-primary/30 bg-background/95 px-5 py-4 shadow-lg">
                  <Images className="mx-auto h-7 w-7 text-primary" />

                  <p className="mt-2 text-sm font-semibold text-foreground">
                    Solte as imagens aqui
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Elas serão adicionadas ao serviço
                  </p>
                </div>
              </div>
            ) : null}

            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Upload className="h-6 w-6 text-primary" />
            </div>

            <span className="mt-3 text-sm font-semibold text-foreground">
              {hasReachedImageLimit
                ? 'Limite de imagens atingido'
                : imagePreviews.length > 0
                  ? 'Adicionar mais imagens'
                  : 'Selecionar, arrastar ou colar imagens'}
            </span>

            <span className="mt-1 max-w-md text-xs leading-5 text-muted-foreground">
              Clique para selecionar, arraste as imagens para esta área ou copie uma imagem e
              pressione{' '}
              <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] font-medium text-foreground shadow-sm">
                Ctrl + V
              </kbd>
              .
            </span>

            <span className="mt-1 text-xs leading-5 text-muted-foreground">
              JPG, PNG ou WebP. Máximo de 5 MB por imagem.
            </span>
          </div>

          <input
            ref={fileInputRef}
            id="images"
            name="images"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={pending}
            onChange={handleImagesChange}
            className="sr-only"
          />

          {imageError ? (
            <p role="alert" className="mt-2 text-sm text-destructive">
              {imageError}
            </p>
          ) : null}

          {state.errors?.images ? (
            <p role="alert" className="mt-2 text-sm text-destructive">
              {state.errors.images[0]}
            </p>
          ) : null}

          {imagePreviews.length > 0 ? (
            <>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {imagePreviews.map((image, index) => (
                  <div
                    key={image.id}
                    className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-secondary"
                  >
                    <img
                      src={image.url}
                      alt={`Prévia da imagem ${index + 1}`}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    />

                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 pb-2 pt-10">
                      <p className="truncate text-xs font-medium text-white">{image.file.name}</p>

                      <p className="mt-0.5 text-[11px] text-white/80">
                        {formatFileSize(image.file.size)}
                      </p>
                    </div>

                    {index === 0 ? (
                      <span className="absolute left-2 top-2 rounded-full bg-background/95 px-2.5 py-1 text-[11px] font-semibold text-foreground shadow-sm backdrop-blur">
                        Capa
                      </span>
                    ) : null}

                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => removeImage(image.id)}
                      aria-label={`Remover imagem ${index + 1}`}
                      className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-background/95 text-foreground shadow-sm backdrop-blur transition hover:bg-destructive hover:text-destructive-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-60 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  {imagePreviews.length}/{MAX_IMAGES}{' '}
                  {imagePreviews.length === 1 ? 'imagem selecionada' : 'imagens selecionadas'}
                </p>

                <button
                  type="button"
                  disabled={pending}
                  onClick={clearImages}
                  className="self-start text-xs font-medium text-destructive transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
                >
                  Remover todas
                </button>
              </div>
            </>
          ) : (
            <p className="mt-3 text-xs text-muted-foreground">
              Nenhuma imagem selecionada. O serviço ainda poderá ser cadastrado sem fotos.
            </p>
          )}
        </div>
      </section>

      {/* Preço */}
      <section className="rounded-xl border border-border bg-card p-4 shadow-card sm:p-6">
        <div className="flex items-start gap-3">
          <div className="shrink-0 rounded-lg bg-primary/10 p-2">
            <CircleDollarSign className="h-5 w-5 text-primary" />
          </div>

          <div className="min-w-0">
            <h2 className="font-display text-lg font-semibold">Preço e cobrança</h2>

            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Escolha como o valor será apresentado no perfil público.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="price_type" className="text-sm font-medium text-foreground">
              Tipo de preço
              <span className="ml-1 text-destructive">*</span>
            </label>

            <select
              id="price_type"
              name="price_type"
              required
              disabled={pending}
              value={priceType}
              onChange={handlePriceTypeChange}
              aria-invalid={Boolean(state.errors?.price_type)}
              aria-describedby={state.errors?.price_type ? 'price-type-error' : undefined}
              className="mt-2 flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {priceTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {state.errors?.price_type ? (
              <p id="price-type-error" className="mt-1.5 text-sm text-destructive">
                {state.errors.price_type[0]}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="price_display" className="text-sm font-medium text-foreground">
              Valor
              {!isCustomQuote ? <span className="ml-1 text-destructive">*</span> : null}
            </label>

            <input type="hidden" name="price" value={priceServerValue} />

            <div className="relative mt-2">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm font-medium text-muted-foreground">
                R$
              </span>

              <input
                id="price_display"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                disabled={isCustomQuote || pending}
                required={!isCustomQuote}
                value={priceDisplay.replace(/^R\$\s?/, '')}
                onChange={handlePriceChange}
                placeholder={isCustomQuote ? 'Sob orçamento' : '0,00'}
                aria-invalid={Boolean(state.errors?.price)}
                aria-describedby={state.errors?.price ? 'price-error' : 'price-help'}
                className="flex h-11 w-full rounded-md border border-input bg-background py-2 pl-10 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-secondary disabled:opacity-70"
              />
            </div>

            {state.errors?.price ? (
              <p id="price-error" className="mt-1.5 text-sm text-destructive">
                {state.errors.price[0]}
              </p>
            ) : null}

            {isCustomQuote ? (
              <p id="price-help" className="mt-1.5 text-xs text-muted-foreground">
                O cliente verá a mensagem “Sob orçamento”.
              </p>
            ) : (
              <p id="price-help" className="mt-1.5 text-xs text-muted-foreground">
                Digite somente os números. Exemplo: 125090 será exibido como R$ 1.250,90.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Publicação */}
      <section className="rounded-xl border border-border bg-card p-4 shadow-card sm:p-6">
        <div className="flex items-start gap-3">
          <div className="shrink-0 rounded-lg bg-primary/10 p-2">
            <FileText className="h-5 w-5 text-primary" />
          </div>

          <div className="min-w-0">
            <h2 className="font-display text-lg font-semibold">Publicação</h2>

            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Defina se o serviço será publicado agora ou salvo como rascunho.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-5">
          <div>
            <label htmlFor="status" className="text-sm font-medium text-foreground">
              Status
            </label>

            <select
              id="status"
              name="status"
              defaultValue="PUBLISHED"
              disabled={pending}
              aria-invalid={Boolean(state.errors?.status)}
              aria-describedby={state.errors?.status ? 'status-error' : undefined}
              className="mt-2 flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60 sm:max-w-sm"
            >
              <option value="PUBLISHED">Publicar agora</option>

              <option value="DRAFT">Salvar como rascunho</option>
            </select>

            {state.errors?.status ? (
              <p id="status-error" className="mt-1.5 text-sm text-destructive">
                {state.errors.status[0]}
              </p>
            ) : null}
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-secondary/40">
            <input
              type="checkbox"
              name="is_featured"
              disabled={pending}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-border text-primary focus:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
            />

            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent" />

            <span>
              <span className="block text-sm font-medium">Marcar como destaque</span>

              <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                Serviços em destaque aparecem primeiro no perfil do seu negócio.
              </span>
            </span>
          </label>
        </div>
      </section>

      {/* Ações */}
      <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:justify-end">
        <Link
          href="/painel/meu-negocio/servicos"
          aria-disabled={pending}
          className={
            pending
              ? 'pointer-events-none inline-flex h-11 w-full items-center justify-center rounded-md border border-border bg-background px-5 text-sm font-medium opacity-60 sm:w-auto'
              : 'inline-flex h-11 w-full items-center justify-center rounded-md border border-border bg-background px-5 text-sm font-medium transition-colors hover:bg-secondary sm:w-auto'
          }
        >
          Cancelar
        </Link>

        <button
          type="submit"
          disabled={isSubmitDisabled}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {pending ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}

          {pending
            ? 'Cadastrando...'
            : !hasCategories
              ? 'Nenhuma categoria disponível'
              : 'Cadastrar serviço'}
        </button>
      </div>
    </form>
  );
}
