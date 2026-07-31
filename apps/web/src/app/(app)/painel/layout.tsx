import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Images,
  LayoutDashboard,
  Store,
} from 'lucide-react';

import { SiteHeader } from '@/components/site-header';
import {
  ensureProfile,
  getSessionUser,
} from '@/lib/data/session';

const navItems = [
  {
    href: '/painel',
    label: 'Visão geral',
    icon: LayoutDashboard,
  },
  {
    href: '/painel/meu-negocio',
    label: 'Meu negócio',
    icon: Store,
  },
  {
    href: '/painel/galeria',
    label: 'Galeria',
    icon: Images,
  },
];

export default async function PainelLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getSessionUser();

  if (!user) {
    redirect('/entrar?next=/painel');
  }

  await ensureProfile(user);

  return (
    <>
      <SiteHeader />

      <div className="container grid gap-8 py-10 lg:grid-cols-[220px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <nav
            aria-label="Navegação do painel"
            className="flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0"
          >
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Icon
                    aria-hidden="true"
                    className="h-4 w-4 shrink-0"
                  />

                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0">{children}</main>
      </div>
    </>
  );
}