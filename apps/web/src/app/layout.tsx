import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import '@fontsource-variable/fraunces/index.css';
import '@fontsource-variable/manrope/index.css';
import './globals.css';
import { env } from '@/env';

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
  title: {
    default: 'BuffetHub — Contrate buffets e serviços para eventos',
    template: '%s · BuffetHub',
  },
  description:
    'Encontre, compare e contrate buffets e fornecedores de eventos com confiança. Do orçamento ao grande dia, tudo em um só lugar.',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'BuffetHub',
    title: 'BuffetHub — Contrate buffets e serviços para eventos',
    description:
      'Encontre, compare e contrate buffets e fornecedores de eventos com confiança.',
  },
};

export const viewport: Viewport = {
  themeColor: '#7a1f52',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
