import type { Metadata } from 'next';
import Link from 'next/link';
import { SignInForm } from '@/components/forms/sign-in-form';
import { Alert } from '@/components/ui/alert';

export const metadata: Metadata = { title: 'Entrar' };

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const next = first(sp.next);
  const hasError = first(sp.error) === 'auth';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Bem-vindo de volta</h1>
        <p className="mt-2 text-muted-foreground">Entre para gerenciar seus eventos e pedidos.</p>
      </div>

      {hasError ? (
        <Alert variant="error">
          Não foi possível validar seu acesso. Tente entrar novamente.
        </Alert>
      ) : null}

      <SignInForm redirectTo={next} />

      <div className="space-y-2 text-sm">
        <p>
          <Link href="/recuperar-senha" className="text-primary hover:underline">
            Esqueceu a senha?
          </Link>
        </p>
        <p className="text-muted-foreground">
          Ainda não tem conta?{' '}
          <Link href="/cadastrar" className="font-medium text-primary hover:underline">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  );
}
