import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <Logo />
      <div>
        <p className="font-display text-6xl font-semibold text-primary">404</p>
        <h1 className="mt-2 text-2xl font-semibold">Página não encontrada</h1>
        <p className="mt-2 text-muted-foreground">
          O link pode estar quebrado ou a página foi removida.
        </p>
      </div>
      <Link href="/" className={buttonVariants({ variant: 'primary' })}>
        Voltar ao início
      </Link>
    </div>
  );
}
