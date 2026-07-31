'use client';

import { useEffect, useState } from 'react';

import ProviderGalleryManager from '@/components/provider-gallery-manager';
import { type ProviderGalleryImage } from '@/lib/data/providers';

export default function GalleryPage() {
  const [initialImages, setInitialImages] = useState<ProviderGalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchImages() {
      try {
        const response = await fetch('/api/painel/galeria');
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error ?? 'Não foi possível carregar a galeria.');
        }

        setInitialImages(data.images ?? []);
      } catch (error) {
        console.error('[GalleryPage] erro ao carregar imagens da galeria:', error);
        setLoadError(
          error instanceof Error
            ? error.message
            : 'Não foi possível carregar a galeria.',
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchImages();
  }, []);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        Carregando galeria...
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-8 text-center text-sm text-destructive shadow-sm">
        {loadError}
      </div>
    );
  }

  return <ProviderGalleryManager initialImages={initialImages} />;
}
