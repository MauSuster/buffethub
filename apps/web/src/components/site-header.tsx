import Link from 'next/link';
import { LayoutDashboard, Search } from 'lucide-react';
import { getSessionUser } from '@/lib/data/session';
import { signOutAction } from '@/lib/actions/auth';
import { Logo } from '@/components/ui/logo';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export async function SiteHeader() {
  const user = await getSessionUser();

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-7">
          <Logo />
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <Link href="/busca" className="transition-colors hover:text-foreground">
              Explorar
            </Link>
            <Link href="/categorias" className="transition-colors hover:text-foreground">
              Categorias
            </Link>
            <Link href="/painel/meu-negocio" className="transition-colors hover:text-foreground">
              Para fornecedores
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/busca"
            aria-label="Buscar"
            className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'md:hidden')}
          >
            <Search />
          </Link>

          {user ? (
            <>
              <Link
                href="/painel"
                className={cn(
                  buttonVariants({ variant: 'ghost', size: 'sm' }),
                  'hidden sm:inline-flex',
                )}
              >
                <LayoutDashboard /> Painel
              </Link>
              <form action={signOutAction}>
                <Button variant="outline" size="sm" type="submit">
                  Sair
                </Button>
              </form>
            </>
          ) : (
            <>
              <Link href="/entrar" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
                Entrar
              </Link>
              <Link href="/cadastrar" className={buttonVariants({ variant: 'primary', size: 'sm' })}>
                Criar conta
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
